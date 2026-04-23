import { useState } from 'react';
import { X, Trash2, BookOpen, Star } from 'lucide-react';
import type { Book, BookStatus, UpdateBookInput } from '../lib/types';
import StatusBadge from './StatusBadge';

interface BookDetailProps {
  book: Book;
  onClose: () => void;
  onUpdate: (id: string, updates: UpdateBookInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_OPTIONS: { id: BookStatus; label: string }[] = [
  { id: 'want',    label: '읽고싶어' },
  { id: 'reading', label: '읽는중' },
  { id: 'done',    label: '완료' },
];

export default function BookDetail({ book, onClose, onUpdate, onDelete }: BookDetailProps) {
  const [status, setStatus]   = useState<BookStatus>(book.status);
  const [rating, setRating]   = useState(book.rating);
  const [memo, setMemo]       = useState(book.memo);
  const [saving, setSaving]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(book.id, { status, rating, memo });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    await onDelete(book.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="animate-slide-up w-full max-w-lg mx-auto bg-[var(--color-surface)] rounded-t-3xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        <div className="overflow-y-auto flex-1 pb-safe">
          {/* cover + title */}
          <div className="flex gap-4 px-5 pt-3 pb-4">
            <div className="w-24 h-36 rounded-xl overflow-hidden bg-[var(--color-surface-2)] shrink-0 border border-[var(--color-border)]">
              {book.cover ? (
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen size={28} className="text-[var(--color-muted)]" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-end gap-1 min-w-0">
              <StatusBadge status={status} size="sm" />
              <p className="text-base font-bold text-[var(--color-text)] leading-snug line-clamp-3">{book.title}</p>
              <p className="text-xs text-[var(--color-muted)]">{book.author}</p>
              {book.publisher && <p className="text-[10px] text-[var(--color-muted)] truncate">{book.publisher} {book.publishedYear}</p>}
            </div>
          </div>

          {/* status */}
          <section className="px-5 pb-4">
            <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-2">상태</p>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                    status === opt.id
                      ? opt.id === 'done'
                        ? 'bg-[var(--color-green)] border-[var(--color-green)] text-white'
                        : opt.id === 'reading'
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-bg)]'
                          : 'bg-[var(--color-indigo)] border-[var(--color-indigo)] text-white'
                      : 'bg-transparent border-[var(--color-border)] text-[var(--color-muted)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* rating */}
          <section className="px-5 pb-4">
            <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-2">별점</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setRating(i + 1 === rating ? 0 : i + 1)}>
                  <Star
                    size={28}
                    className={`transition-colors duration-150 ${i < rating ? 'text-[var(--color-accent)] fill-[var(--color-accent)]' : 'text-[var(--color-border)]'}`}
                  />
                </button>
              ))}
            </div>
          </section>

          {/* memo */}
          <section className="px-5 pb-4">
            <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-2">메모</p>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="이 책에 대한 생각을 적어보세요..."
              rows={4}
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] resize-none focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-200"
            />
          </section>

          {/* description */}
          {book.description && (
            <section className="px-5 pb-4">
              <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-2">소개</p>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed line-clamp-5">{book.description}</p>
            </section>
          )}
        </div>

        {/* actions */}
        <div className="px-5 py-4 border-t border-[var(--color-border)] flex gap-3 shrink-0">
          <button
            onClick={handleDelete}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200 shrink-0 ${
              confirmDel
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)]'
            }`}
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)] transition-all duration-200"
          >
            <X size={16} className="inline mr-1" />취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-bold transition-all duration-200 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
