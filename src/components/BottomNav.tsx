import { Home, BookMarked, ScanLine, BarChart3 } from 'lucide-react';

export type TabId = 'home' | 'library' | 'scan' | 'stats';

interface BottomNavProps {
  current: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home',    label: '홈',   icon: Home },
  { id: 'library', label: '서재', icon: BookMarked },
  { id: 'scan',    label: '스캔', icon: ScanLine },
  { id: 'stats',   label: '통계', icon: BarChart3 },
];

export default function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav className="glass safe-area-bottom fixed bottom-0 left-0 right-0 z-50">
      <div className="flex items-center max-w-lg mx-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = current === id;
          const isScan = id === 'scan';
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-200 ${
                isScan ? 'relative -mt-5' : ''
              }`}
            >
              {isScan ? (
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--color-accent)] shadow-[0_0_24px_rgba(245,158,11,0.5)]'
                    : 'bg-[var(--color-surface-3)] border border-[var(--color-border)]'
                }`}>
                  <Icon size={24} className={isActive ? 'text-[var(--color-bg)]' : 'text-[var(--color-muted)]'} />
                </div>
              ) : (
                <>
                  <Icon
                    size={20}
                    className={`transition-colors duration-200 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}
                  />
                  <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}>
                    {label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
