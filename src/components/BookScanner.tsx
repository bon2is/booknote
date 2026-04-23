import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2, CameraOff } from 'lucide-react';

interface BookScannerProps {
  onScan: (isbn: string) => void;
  onError?: (message: string) => void;
}

export default function BookScanner({ onScan, onError }: BookScannerProps) {
  const containerId = 'qr-scanner-container';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<'loading' | 'scanning' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 120 } },
      (decodedText) => {
        if (calledRef.current) return;
        const isbn = decodedText.replace(/[^0-9X]/gi, '');
        if (isbn.length === 10 || isbn.length === 13) {
          calledRef.current = true;
          onScan(isbn);
        }
      },
      () => {}
    )
      .then(() => setState('scanning'))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '카메라를 시작할 수 없습니다.';
        setErrorMsg(msg);
        setState('error');
        onError?.(msg);
      });

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {});
    };
  }, [onScan, onError]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        <div id={containerId} className="w-full h-full" />

        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/80">
            <Loader2 size={32} className="text-[var(--color-accent)] animate-spin" />
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg)] gap-3 p-6 text-center">
            <CameraOff size={32} className="text-[var(--color-muted)]" />
            <p className="text-sm text-[var(--color-muted)]">{errorMsg || '카메라 접근 권한이 필요합니다.'}</p>
          </div>
        )}

        {state === 'scanning' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-60 h-28 relative">
                <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[var(--color-accent)] rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[var(--color-accent)] rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[var(--color-accent)] rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[var(--color-accent)] rounded-br-lg" />
                <div className="scan-line absolute top-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]/70" />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-[11px] text-white/70 bg-black/50 px-3 py-1 rounded-full">바코드를 네모 안에 맞춰주세요</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
