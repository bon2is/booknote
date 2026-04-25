import { BookOpen, ScanLine, CheckCircle2, BookMarked, ChevronRight, Flame } from 'lucide-react';
import type { Book } from '../lib/types';
import BookCard from '../components/BookCard';

interface HomePageProps {
  books: Book[];
  onBookClick: (book: Book) => void;
  onScanClick: () => void;
}

export default function HomePage({ books, onBookClick, onScanClick }: HomePageProps) {
  const done    = books.filter(b => b.status === 'done');
  const reading = books.filter(b => b.status === 'reading');
  const want    = books.filter(b => b.status === 'want');
  const recent  = [...books].sort((a, b) => b.addedAt - a.addedAt).slice(0, 10);

  return (
    <div className="animate-fade-in pb-28">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] text-[var(--color-muted)] font-semibold tracking-[0.18em] uppercase mb-0.5">
            MY LIBRARY
          </p>
          <h1 className="text-[28px] font-black tracking-tight text-[var(--color-text)] leading-none">
            북노트
            <span className="ml-1.5 text-[var(--color-accent)]">.</span>
          </h1>
        </div>
        {done.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
            bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20">
            <Flame size={12} className="text-[var(--color-accent)]" />
            <span className="text-[11px] font-bold text-[var(--color-accent)]">{done.length}권 완독</span>
          </div>
        )}
      </div>

      {/* ── Hero scan CTA ───────────────────────────────── */}
      <div className="px-5 mb-6">
        <button
          onClick={onScanClick}
          className="w-full relative overflow-hidden rounded-2xl p-5
            bg-[var(--color-accent)] active:scale-[0.98] transition-transform duration-150
            flex items-center justify-between gap-4 group"
        >
          {/* dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              color: 'var(--color-bg)',
            }}
          />
          <div className="relative z-10">
            <p className="text-[var(--color-bg)] text-[11px] font-semibold tracking-widest uppercase mb-0.5 opacity-80">
              바코드 스캔
            </p>
            <p className="text-[var(--color-bg)] text-lg font-black leading-tight">
              책 추가하기
            </p>
          </div>
          <div className="relative z-10 w-11 h-11 rounded-xl bg-[var(--color-bg)]/20
            flex items-center justify-center group-active:bg-[var(--color-bg)]/30 transition-colors">
            <ScanLine size={22} className="text-[var(--color-bg)]" />
          </div>
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────── */}
      <div className="px-5 mb-7">
        <div className="glass rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-[var(--color-border)]">
            {[
              { label: '완독', value: done.length,    icon: CheckCircle2, color: 'var(--color-green)'  },
              { label: '읽는 중', value: reading.length, icon: BookOpen,     color: 'var(--color-accent)' },
              { label: '찜',    value: want.length,    icon: BookMarked,   color: 'var(--color-indigo)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex flex-col items-center py-4 gap-1.5">
                <Icon size={14} style={{ color }} />
                <p className="text-2xl font-black" style={{ color }}>{value}</p>
                <p className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-border)] px-4 py-2.5 flex items-center justify-between">
            <p className="text-[11px] text-[var(--color-muted)]">
              전체 <strong className="text-[var(--color-text)]">{books.length}권</strong>
            </p>
            <button
              onClick={onScanClick}
              className="text-[11px] font-bold text-[var(--color-accent)] flex items-center gap-0.5"
            >
              추가 <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Currently reading ───────────────────────────── */}
      {reading.length > 0 && (
        <div className="px-5 mb-7">
          <p className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-3">
            읽는 중
          </p>
          <div className="flex flex-col gap-2.5">
            {reading.map(book => (
              <div
                key={book.id}
                onClick={() => onBookClick(book)}
                className="glass rounded-2xl p-3.5 border border-[var(--color-accent)]/25
                  flex gap-3.5 cursor-pointer active:scale-[0.98] transition-transform duration-150"
              >
                <div className="w-11 h-16 rounded-lg overflow-hidden bg-[var(--color-surface-2)] shrink-0 border border-[var(--color-border)]">
                  {book.cover
                    ? <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={14} className="text-[var(--color-muted)]" />
                      </div>
                  }
                </div>
                <div className="flex flex-col justify-center min-w-0 gap-0.5">
                  <p className="text-sm font-bold text-[var(--color-text)] line-clamp-2 leading-snug">{book.title}</p>
                  <p className="text-[11px] text-[var(--color-muted)] truncate">{book.author}</p>
                  <div className="mt-1.5 h-1 rounded-full bg-[var(--color-surface-3)] overflow-hidden w-24">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: '35%' }}
                    />
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--color-muted)] self-center ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent books ────────────────────────────────── */}
      <div className="mb-2">
        <div className="px-5 flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-widest">
            최근 추가
          </p>
          {recent.length > 0 && (
            <span className="text-[11px] text-[var(--color-muted)]">{books.length}권</span>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="mx-5 glass rounded-2xl border border-[var(--color-border)]
            flex flex-col items-center text-center py-10 px-6 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-dim)]
              flex items-center justify-center">
              <BookOpen size={24} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-text)] mb-1">아직 책이 없어요</p>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                바코드를 스캔하거나 직접 입력해서<br />첫 번째 책을 추가해보세요
              </p>
            </div>
            <button
              onClick={onScanClick}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)]
                text-sm font-bold flex items-center gap-2"
            >
              <ScanLine size={15} />
              첫 책 추가하기
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory">
            {recent.map(book => (
              <div key={book.id} className="snap-start shrink-0 w-[108px]">
                <BookCard book={book} onClick={onBookClick} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
