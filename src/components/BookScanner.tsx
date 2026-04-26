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

    // Path A: 네이티브 BarcodeDetector (Android Chrome — 내장 바코드 인식 엔진)
    async function initBarcodeDetector() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e'],
      });

      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (dead) { mediaStream.getTracks().forEach(t => t.stop()); return; }

      videoEl = document.createElement('video');
      videoEl.playsInline = true;
      videoEl.muted = true;
      videoEl.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
      // React 자식 앞에 삽입해야 오버레이가 위에 표시됨
      wrapRef.current!.insertBefore(videoEl, wrapRef.current!.firstChild);
      videoEl.srcObject = mediaStream;
      await videoEl.play();
      if (dead) return;

      setScanState('scanning');

      // 100ms 간격(약 10fps)으로 프레임 분석
      timerId = window.setInterval(async () => {
        if (dead || !videoEl) return;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bcs: { rawValue: string }[] = await detector.detect(videoEl);
          bcs.forEach(bc => emit(bc.rawValue));
        } catch { /* 프레임 미준비 상태 무시 */ }
      }, 100);
    }

    // Path B: html5-qrcode + ZXing (Safari 등 BarcodeDetector 미지원)
    async function initHtml5Qrcode() {
      html5Scanner = new Html5Qrcode(html5Id, {
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
          fps: 15,
          qrbox: { width: 280, height: 140 },
          videoConstraints: {
            facingMode: 'environment',
            width:  { ideal: 1920 },
            height: { ideal: 1080 },
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
          // 기기에서 지원 안 하면 html5-qrcode로 폴백
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
        {/* html5-qrcode가 렌더링할 컨테이너 (BarcodeDetector 모드에서는 비어 있음) */}
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
