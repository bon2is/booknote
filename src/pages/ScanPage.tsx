import { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import type { Book, CreateBookInput } from '../lib/types';
import { fetchBookByIsbn } from '../lib/bookApi';
import BookScanner from '../components/BookScanner';

interface ScanPageProps {
  onAdd: (input: CreateBookInput) => Promise<Book>;
  onBookClick: (book: Book) => void;
}

type ScanState = 'idle' | 'fetching' | 'success' | 'error' | 'duplicate';

export default function ScanPage({ onAdd, onBookClick }: ScanPageProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [message, setMessage]     = useState('');
  const [lastBook, setLastBook]   = useState<Book | null>(null);
  const [key, setKey]             = useState(0);

  const handleScan = useCallback(async (isbn: string) => {
    setScanState('fetching');
    setMessage('책 정보를 가져오는 중...');

    const info = await fetchBookByIsbn(isbn);
    if (!info) {
      setScanState('error');
      setMessage(`ISBN ${isbn} 에 해당하는 책을 찾을 수 없어요.`);
      return;
    }

    const book = await onAdd({ ...info, status: 'want', rating: 0, memo: '', finishedAt: undefined });

    if (book.addedAt < Date.now() - 2000) {
      setScanState('duplicate');
      setMessage(`"${book.title}" 은 이미 서재에 있어요.`);
    } else {
      setScanState('success');
      setMessage(`"${book.title}" 을 추가했어요!`);
    }
    setLastBook(book);
  }, [onAdd]);

  const handleReset = () => {
    setScanState('idle');
    setMessage('');
    setLastBook(null);
    setKey(k => k + 1);
  };

  return (
    <div className="animate-fade-in pb-28">
      <div className="px-5 pt-14 pb-6">
        <p className="text-xs text-[var(--color-muted)] font-medium tracking-widest uppercase mb-1">바코드 스캔</p>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">책 추가하기</h1>
      </div>

      <div className="px-5">
        {(scanState === 'idle' || scanState === 'fetching') && (
          <BookScanner key={key} onScan={handleScan} />
        )}

        {scanState === 'fetching' && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Loader2 size={16} className="text-[var(--color-accent)] animate-spin" />
            <p className="text-sm text-[var(--color-muted)]">{message}</p>
          </div>
        )}

        {(scanState === 'success' || scanState === 'duplicate') && lastBook && (
          <div className="glass rounded-2xl p-5 border border-[var(--color-border)] flex flex-col items-center text-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              scanState === 'success' ? 'bg-[var(--color-green-dim)]' : 'bg-[var(--color-accent-dim)]'
            }`}>
              <CheckCircle2 size={24} className={scanState === 'success' ? 'text-[var(--color-green)]' : 'text-[var(--color-accent)]'} />
            </div>
            <p className="text-sm font-bold text-[var(--color-text)]">{message}</p>
            {lastBook.cover ? (
              <img src={lastBook.cover} alt={lastBook.title} className="w-24 h-36 object-cover rounded-xl border border-[var(--color-border)]" />
            ) : (
              <div className="w-24 h-36 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
                <BookOpen size={24} className="text-[var(--color-muted)]" />
              </div>
            )}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { onBookClick(lastBook); handleReset(); }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)]"
              >
                상세 보기
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-bold"
              >
                계속 스캔
              </button>
            </div>
          </div>
        )}

        {scanState === 'error' && (
          <div className="glass rounded-2xl p-5 border border-[var(--color-border)] flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <p className="text-sm text-[var(--color-muted)]">{message}</p>
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)]"
            >
              다시 스캔
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
