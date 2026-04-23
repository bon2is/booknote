import { BookOpen, BookMarked, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Book } from '../lib/types';
import BookCard from '../components/BookCard';
import EmptyState from '../components/EmptyState';

interface HomePageProps {
  books: Book[];
  onBookClick: (book: Book) => void;
}

export default function HomePage({ books, onBookClick }: HomePageProps) {
  const done    = books.filter(b => b.status === 'done');
  const reading = books.filter(b => b.status === 'reading');
  const want    = books.filter(b => b.status === 'want');
  const recent  = [...books].sort((a, b) => b.addedAt - a.addedAt).slice(0, 10);

  const STATS = [
    { label: '읽은 책',  value: done.length,    icon: CheckCircle2, color: 'var(--color-green)' },
    { label: '읽는 중',  value: reading.length, icon: BookOpen,     color: 'var(--color-accent)' },
    { label: '읽고싶어', value: want.length,     icon: BookMarked,   color: 'var(--color-indigo)' },
    { label: '전체',     value: books.length,   icon: TrendingUp,   color: 'var(--color-text)' },
  ];

  return (
    <div className="animate-fade-in pb-28">
      <div className="px-5 pt-14 pb-6">
        <p className="text-xs text-[var(--color-muted)] font-medium tracking-widest uppercase mb-1">나의 서재</p>
        <h1 className="text-2xl font-bold text-[var(--color-text)] leading-tight">
          {books.length > 0 ? `${done.length}권 완독했어요` : '첫 책을 추가해보세요'}
        </h1>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3 mb-8">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl p-4 border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[var(--color-muted)] font-semibold uppercase tracking-wider">{label}</p>
              <Icon size={14} style={{ color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="px-5">
        <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-3">최근 추가</p>
        {recent.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={24} />}
            title="아직 책이 없어요"
            description="스캔 탭에서 바코드를 찍어 첫 번째 책을 추가해보세요"
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory">
            {recent.map(book => (
              <div key={book.id} className="snap-start shrink-0 w-32">
                <BookCard book={book} onClick={onBookClick} />
              </div>
            ))}
          </div>
        )}
      </div>

      {reading.length > 0 && (
        <div className="px-5 mt-8">
          <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-3">읽는 중</p>
          <div className="flex flex-col gap-3">
            {reading.map(book => (
              <div
                key={book.id}
                className="glass rounded-2xl p-3 border border-[var(--color-accent)]/30 flex gap-3 cursor-pointer active:scale-[0.98] transition-transform duration-150"
                onClick={() => onBookClick(book)}
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-[var(--color-surface-2)] shrink-0">
                  {book.cover
                    ? <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen size={16} className="text-[var(--color-muted)]" /></div>
                  }
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text)] line-clamp-2 leading-snug">{book.title}</p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5 truncate">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
