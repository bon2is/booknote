import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import type { Book, BookStatus } from '../lib/types';
import BookCard from '../components/BookCard';
import EmptyState from '../components/EmptyState';

interface LibraryPageProps {
  books: Book[];
  onBookClick: (book: Book) => void;
}

type FilterTab = 'all' | BookStatus;

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',     label: '전체' },
  { id: 'reading', label: '읽는중' },
  { id: 'want',    label: '읽고싶어' },
  { id: 'done',    label: '완료' },
];

export default function LibraryPage({ books, onBookClick }: LibraryPageProps) {
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = filter === 'all' ? books : books.filter(b => b.status === filter);
  const sorted   = [...filtered].sort((a, b) => b.addedAt - a.addedAt);

  return (
    <div className="animate-fade-in pb-28">
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">서재</h1>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">{books.length}권 보관 중</p>
      </div>

      <div className="px-5 flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {TABS.map(tab => {
          const count = tab.id === 'all' ? books.length : books.filter(b => b.status === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                filter === tab.id
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-bg)]'
                  : 'bg-transparent border-[var(--color-border)] text-[var(--color-muted)]'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] font-bold ${filter === tab.id ? 'text-[var(--color-bg)]/70' : 'text-[var(--color-muted)]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={24} />}
          title="책이 없어요"
          description="스캔 탭에서 바코드를 찍어 책을 추가해보세요"
        />
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3">
          {sorted.map(book => (
            <BookCard key={book.id} book={book} onClick={onBookClick} />
          ))}
        </div>
      )}
    </div>
  );
}
