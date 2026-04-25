import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

declare global {
  interface Window { adsbygoogle: object[] }
}

const SESSION_KEY = 'ad_banner_dismissed';

export default function AdBanner() {
  const [visible, setVisible] = useState(() =>
    sessionStorage.getItem(SESSION_KEY) !== '1'
  );
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!visible || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  return (
    // max-height 트랜지션으로 접을 때 빈 영역이 남지 않음
    <div
      style={{ maxHeight: visible ? '90px' : '0px' }}
      className="overflow-hidden transition-[max-height] duration-300 ease-in-out shrink-0"
    >
      <div className="relative bg-[var(--color-surface)] border-b border-[var(--color-border)] min-h-[50px]">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-7999144867236526"
          data-ad-slot="AUTO"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <button
          onClick={dismiss}
          className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full
            bg-[var(--color-surface-2)] border border-[var(--color-border)]
            flex items-center justify-center active:scale-90 transition-transform"
          aria-label="광고 닫기"
        >
          <ChevronDown size={12} className="text-[var(--color-muted)]" />
        </button>
      </div>
    </div>
  );
}
