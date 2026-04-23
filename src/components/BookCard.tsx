import { BookOpen } from 'lucide-react';
import type { Book } from '../lib/types';
import StatusBadge from './StatusBadge';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div
      className="book-card relative rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]"
      onClick={() => onClick(book)}
    >
      <div className="relative aspect-[2/3] w-full bg-[var(--color-surface-2)] overflow-hidden">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
            <BookOpen size={28} className="text-[var(--color-muted)]" />
            <span className="text-[10px] text-[var(--color-muted)] text-center leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <StatusBadge status={book.status} />
        </div>
        {book.status === 'done' && (
          <div className="absolute inset-0 bg-[var(--color-green)]/10 flex items-end justify-end p-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-green)] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5">
        <p className="text-xs font-semibold text-[var(--color-text)] leading-snug line-clamp-2 mb-0.5">
          {book.title}
        </p>
        <p className="text-[10px] text-[var(--color-muted)] truncate">{book.author}</p>
        {book.rating > 0 && (
          <div className="flex mt-1 gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-[10px] ${i < book.rating ? 'text-[var(--color-accent)]' : 'text-[var(--color-border)]'}`}>★</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
