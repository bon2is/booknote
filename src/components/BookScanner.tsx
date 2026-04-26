import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, CameraOff } from 'lucide-react';

interface BookScannerProps {
  onScan: (isbn: string) => void;
  onError?: (message: string) => void;
}

function toIsbn(raw: string): string | null {
  const d = raw.replace(/[^0-9X]/gi, '');
  return d.length === 10 || d.length === 13 ? d : null;
}

// 스트림의 비디오 트랙에 autofocus 적용 (지원 기기만)
async function applyAutofocus(stream: MediaStream) {
  const track = stream.getVideoTracks()[0];
  if (!track) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = track.getCapabilities() as any;
    const supported = cap.focusMode as string[] | undefined;
    if (!supported) return;
    // single-shot으로 한 번 트리거 후 continuous로 전환
    if (supported.includes('single-shot')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' } as any] });
      await new Promise(r => setTimeout(r, 400));
    }
    if (supported.includes('continuous')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
    }
  } catch { /* focusMode 미지원 기기 무시 */ }
}

export default function BookScanner({ onScan, onError }: BookScannerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scanState, setScanState] = useState<'loading' | 'scanning' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const doneRef = useRef(false);

  const emit = useCallback((raw: string) => {
    if (doneRef.current) return;
    const isbn = toIsbn(raw);
    if (isbn) { doneRef.current = true; onScan(isbn); }
  }, [onScan]);

  useEffect(() => {
    let dead = false;
    let timerId = 0;
    let html5Scanner: Html5Qrcode | null = null;
    let videoEl: HTMLVideoElement | null = null;
    let mediaStream: MediaStream | null = null;
    const html5Id = 'qr-scanner-container';

    // Path A: 네이티브 BarcodeDetector (Android Chrome)
    async function initBarcodeDetector() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e'],
      });

      // 1280×720: 고해상도(1920)보다 모바일 autofocus 성능이 훨씬 안정적
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (dead) { mediaStream.getTracks().forEach(t => t.stop()); return; }

      await applyAutofocus(mediaStream);

      videoEl = document.createElement('video');
      videoEl.playsInline = true;
      videoEl.muted = true;
      videoEl.setAttribute('autoplay', '');
      videoEl.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
      wrapRef.current!.insertBefore(videoEl, wrapRef.current!.firstChild);
      videoEl.srcObject = mediaStream;
      await videoEl.play();
      if (dead) return;

      setScanState('scanning');

      // 카메라 초점이 안정될 때까지 1.5초 대기 후 detection 시작
      await new Promise(r => setTimeout(r, 1500));
      if (dead) return;

      timerId = window.setInterval(async () => {
        if (dead || !videoEl || videoEl.readyState < 2) return;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bcs: { rawValue: string }[] = await detector.detect(videoEl);
          bcs.forEach(bc => emit(bc.rawValue));
        } catch { /* 검출 실패 프레임 무시 */ }
      }, 150);
    }

    // Path B: html5-qrcode + ZXing (Safari 등 BarcodeDetector 미지원)
    async function initHtml5Qrcode() {
      html5Scanner = new Html5Qrcode(html5Id, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      });
      await html5Scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 140 },
          videoConstraints: {
            facingMode: 'environment',
            width:  { ideal: 1280 },
            height: { ideal: 720 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            advanced: [{ focusMode: 'continuous' } as any],
          },
        },
        (raw) => emit(raw),
        () => {},
      );
      if (dead) { html5Scanner.stop().catch(() => {}); return; }
      setScanState('scanning');
    }

    async function init() {
      if (!wrapRef.current) return;

      if ('BarcodeDetector' in window) {
        try {
          await initBarcodeDetector();
          return;
        } catch {
          // 기기 미지원 시 html5-qrcode로 폴백
        }
      }
      if (!dead) await initHtml5Qrcode();
    }

    init().catch(err => {
      if (!dead) {
        const msg = err instanceof Error ? err.message : '카메라를 시작할 수 없습니다.';
        setErrorMsg(msg);
        setScanState('error');
        onError?.(msg);
      }
    });

    return () => {
      dead = true;
      clearInterval(timerId);
      mediaStream?.getTracks().forEach(t => t.stop());
      videoEl?.remove();
      if (html5Scanner?.isScanning) html5Scanner.stop().catch(() => {});
    };
  }, [emit, onError]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div ref={wrapRef} className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        <div id="qr-scanner-container" className="w-full h-full" />

        {scanState === 'loading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-bg)]/80">
            <Loader2 size={32} className="text-[var(--color-accent)] animate-spin" />
          </div>
        )}

        {scanState === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--color-bg)] gap-3 p-6 text-center">
            <CameraOff size={32} className="text-[var(--color-muted)]" />
            <p className="text-sm text-[var(--color-muted)]">
              {errorMsg || '카메라 접근 권한이 필요합니다.'}
            </p>
          </div>
        )}

        {scanState === 'scanning' && (
          <>
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-36 relative">
                <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[var(--color-accent)] rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[var(--color-accent)] rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[var(--color-accent)] rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[var(--color-accent)] rounded-br-lg" />
                <div className="scan-line absolute top-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]/70" />
              </div>
            </div>
            <div className="absolute bottom-3 z-10 left-0 right-0 text-center">
              <span className="text-[11px] text-white/70 bg-black/50 px-3 py-1 rounded-full">
                바코드를 네모 안에 맞춰주세요
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
