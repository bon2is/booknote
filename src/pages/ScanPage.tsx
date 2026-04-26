import { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Loader2, BookOpen, PenLine } from 'lucide-react';
import type { Book, CreateBookInput } from '../lib/types';
import { fetchBookByIsbn } from '../lib/bookApi';
import BookScanner from '../components/BookScanner';

interface ScanPageProps {
  onAdd: (input: CreateBookInput) => Promise<Book>;
  onBookClick: (book: Book) => void;
}

type ScanState = 'idle' | 'fetching' | 'success' | 'error' | 'duplicate' | 'manual';

interface ManualForm {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedYear: string;
}

export default function ScanPage({ onAdd, onBookClick }: ScanPageProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [message, setMessage]     = useState('');
  const [lastBook, setLastBook]   = useState<Book | null>(null);
  const [key, setKey]             = useState(0);
  const [form, setForm]           = useState<ManualForm>({
    isbn: '', title: '', author: '', publisher: '', publishedYear: '',
  });

  const handleScan = useCallback(async (isbn: string) => {
    setScanState('fetching');
    setMessage('책 정보를 가져오는 중...');

    // API 전체 체인에 10초 하드타임아웃 (각 요청은 5초 per-request 타임아웃 별도 적용)
    const hardTimeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 10000));
    const info = await Promise.race([fetchBookByIsbn(isbn), hardTimeout]);

    if (!info) {
      setScanState('error');
      setMessage(`ISBN ${isbn} 에 해당하는 책을 찾을 수 없어요.`);
      setForm({ isbn, title: '', author: '', publisher: '', publishedYear: '' });
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

  const handleManualSave = async () => {
    if (!form.title.trim()) return;
    const book = await onAdd({
      isbn:          form.isbn,
      title:         form.title.trim(),
      author:        form.author.trim(),
      cover:         '',
      publisher:     form.publisher.trim(),
      publishedYear: form.publishedYear.trim(),
      description:   '',
      status:        'want',
      rating:        0,
      memo:          '',
    });
    setScanState('success');
    setMessage(`"${book.title}" 을 추가했어요!`);
    setLastBook(book);
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
            <div className="flex gap-3 w-full">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)]"
              >
                다시 스캔
              </button>
              <button
                onClick={() => setScanState('manual')}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <PenLine size={14} />
                직접 입력
              </button>
            </div>
          </div>
        )}

        {scanState === 'manual' && (
          <div className="glass rounded-2xl p-5 border border-[var(--color-border)] flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-1">
              <PenLine size={16} className="text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text)]">직접 입력하기</h2>
            </div>

            {([
              { label: '책 제목 *', field: 'title',         placeholder: '예: 공부가 되는 세계 명화', type: 'text'   },
              { label: '저자',      field: 'author',        placeholder: '예: 홍길동',                type: 'text'   },
              { label: '출판사',    field: 'publisher',     placeholder: '예: 그린북',                type: 'text'   },
              { label: '출판연도',  field: 'publishedYear', placeholder: '예: 2018',                  type: 'number' },
            ] as const).map(({ label, field, placeholder, type }) => (
              <div key={field} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[field]}
                  onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]
                    text-[var(--color-text)] text-sm placeholder:text-[var(--color-muted)]
                    focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>
            ))}

            {form.isbn && (
              <p className="text-xs text-[var(--color-muted)] -mt-2">ISBN: {form.isbn}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)]"
              >
                취소
              </button>
              <button
                onClick={handleManualSave}
                disabled={!form.title.trim()}
                className="flex-1 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-bold
                  disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                저장하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
