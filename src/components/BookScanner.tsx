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

const CONTAINER_ID = 'qr-scanner-container';

export default function BookScanner({ onScan, onError }: BookScannerProps) {
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
    let nativeTimerId = 0;
    let scanner: Html5Qrcode | null = null;

    async function start() {
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
            width:  { ideal: 1920 },
            height: { ideal: 1080 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            advanced: [{ focusMode: 'continuous' } as any],
          },
        },
        (raw) => emit(raw),
        () => {},
      );

      if (dead) { scanner.stop().catch(() => {}); return; }
      setScanState('scanning');

      // BarcodeDetector 가속 (Android Chrome 전용)
      // html5-qrcode가 생성한 video 엘리먼트를 재사용 — 별도 카메라 스트림 없음
      if ('BarcodeDetector' in window) {
        const videoEl = document.querySelector<HTMLVideoElement>(`#${CONTAINER_ID} video`);
        if (videoEl) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e'],
          });
          nativeTimerId = window.setInterval(async () => {
            if (dead || videoEl.readyState < 2) return;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const bcs: { rawValue: string }[] = await detector.detect(videoEl);
              bcs.forEach(bc => emit(bc.rawValue));
            } catch { /* 검출 실패 프레임 무시 */ }
          }, 100);
        }
      }
    }

    start().catch(err => {
      if (!dead) {
        const msg = err instanceof Error ? err.message : '카메라를 시작할 수 없습니다.';
        setErrorMsg(msg);
        setScanState('error');
        onError?.(msg);
      }
    });

    return () => {
      dead = true;
      clearInterval(nativeTimerId);
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, [emit, onError]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
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
                바코드를 네모 안에 맞춰주세요
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
