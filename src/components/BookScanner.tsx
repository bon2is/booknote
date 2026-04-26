import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, CameraOff } from 'lucide-react';

interface BookScannerProps {
  onScan: (isbn: string) => void;
  onError?: (message: string) => void;
}

// EAN-13(ISBN-13) 또는 ISBN-10만 허용 — EAN-5 가격 보조코드(5자리) 자동 제외
function toIsbn(raw: string): string | null {
  const d = raw.replace(/[^0-9X]/gi, '');
  return d.length === 10 || d.length === 13 ? d : null;
}

const CONTAINER_ID = 'qr-scanner-container';

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
    let detectTimer = 0;
    let mediaStream: MediaStream | null = null;
    let videoEl: HTMLVideoElement | null = null;
    let scanner: Html5Qrcode | null = null;

    // ── Path A: BarcodeDetector (Android Chrome) ──────────────────────────────
    // 풀 해상도 + 하드웨어 가속으로 ZXing 대비 훨씬 높은 인식률.
    // applyAutofocus 같은 수동 개입 없이 카메라가 자연스럽게 연속 포커스를 유지.
    async function initBarcodeDetector() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e'],
      });

      // 1280×720: 바코드 스캔 최적 해상도 (≤2MP 권장, 과도한 해상도는 오히려 역효과)
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (dead) { mediaStream.getTracks().forEach(t => t.stop()); return; }

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

      // 프레임 건너뛰기(frame-skip) 전략:
      // detector.detect()가 완료되기 전에 다음 프레임을 큐잉하지 않음
      let detecting = false;
      function scheduleDetect() {
        if (dead) return;
        detectTimer = window.setTimeout(async () => {
          if (!dead && videoEl && videoEl.readyState >= 2 && !detecting) {
            detecting = true;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const bcs: { rawValue: string }[] = await detector.detect(videoEl);
              // BarcodeDetector는 EAN-13(ISBN)과 EAN-5(가격 보조코드)를 각각 반환.
              // toIsbn()이 5자리 보조코드를 자동으로 걸러냄.
              bcs.forEach(bc => emit(bc.rawValue));
            } catch { /* 프레임 미준비 무시 */ } finally {
              detecting = false;
            }
          }
          scheduleDetect();
        }, 100);
      }
      scheduleDetect();
    }

    // ── Path B: html5-qrcode + ZXing (Safari / iOS 폴백) ────────────────────
    async function initHtml5Qrcode() {
      scanner = new Html5Qrcode(CONTAINER_ID, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      });

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 140 },
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1280 },
            height: { ideal: 720 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            advanced: [{ focusMode: 'continuous' } as any],
          },
        },
        (raw) => emit(raw),
        () => {},
      );
      if (dead) { scanner.stop().catch(() => {}); return; }
      setScanState('scanning');
    }

    async function init() {
      if ('BarcodeDetector' in window) {
        try {
          await initBarcodeDetector();
          return;
        } catch { /* 기기 미지원 시 html5-qrcode로 폴백 */ }
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
      clearTimeout(detectTimer);
      mediaStream?.getTracks().forEach(t => t.stop());
      videoEl?.remove();
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, [emit, onError]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div ref={wrapRef} className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        {/* html5-qrcode 컨테이너 (BarcodeDetector 모드에서는 빈 상태) */}
        <div id={CONTAINER_ID} className="w-full h-full" />

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
                ISBN 바코드(긴 쪽)를 네모 안에 맞춰주세요
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
