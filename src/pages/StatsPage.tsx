import { BarChart3 } from 'lucide-react';
import type { Book } from '../lib/types';
import EmptyState from '../components/EmptyState';

interface StatsPageProps {
  books: Book[];
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function StatsPage({ books }: StatsPageProps) {
  const done    = books.filter(b => b.status === 'done');
  const reading = books.filter(b => b.status === 'reading');
  const want    = books.filter(b => b.status === 'want');

  const ratedBooks = books.filter(b => b.rating > 0);
  const avgRating  = ratedBooks.length > 0
    ? (ratedBooks.reduce((s, b) => s + b.rating, 0) / ratedBooks.length).toFixed(1)
    : '—';

  const rateDist = [5, 4, 3, 2, 1].map(r => ({
    star: r,
    count: ratedBooks.filter(b => b.rating === r).length,
  }));
  const maxRateCount = Math.max(...rateDist.map(r => r.count), 1);

  const COLORS = {
    done:    'var(--color-green)',
    reading: 'var(--color-accent)',
    want:    'var(--color-indigo)',
  };

  return (
    <div className="animate-fade-in pb-28">
      <div className="px-5 pt-14 pb-6">
        <p className="text-xs text-[var(--color-muted)] font-medium tracking-widest uppercase mb-1">독서 기록</p>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">통계</h1>
      </div>

      {books.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={24} />}
          title="아직 데이터가 없어요"
          description="책을 추가하면 통계가 여기에 표시됩니다"
        />
      ) : (
        <div className="px-5 flex flex-col gap-4">
          {/* status breakdown */}
          <div className="glass rounded-2xl p-5 border border-[var(--color-border)]">
            <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-4">독서 현황</p>
            <div className="flex gap-4 mb-5">
              {([
                { label: '완독',   count: done.length,    color: COLORS.done },
                { label: '읽는중', count: reading.length, color: COLORS.reading },
                { label: '찜',     count: want.length,    color: COLORS.want },
              ] as const).map(({ label, count, color }) => (
                <div key={label} className="flex-1 text-center">
                  <p className="text-2xl font-bold mb-1" style={{ color }}>{count}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {done.length > 0    && <div style={{ flex: done.length,    backgroundColor: COLORS.done }}    className="rounded-l-full" />}
              {reading.length > 0 && <div style={{ flex: reading.length, backgroundColor: COLORS.reading }}               />}
              {want.length > 0    && <div style={{ flex: want.length,    backgroundColor: COLORS.want }}    className="rounded-r-full" />}
            </div>
            <p className="text-xs text-[var(--color-muted)] text-right mt-2">총 {books.length}권</p>
          </div>

          {/* rating distribution */}
          <div className="glass rounded-2xl p-5 border border-[var(--color-border)]">
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest">별점 분포</p>
              <p className="text-xl font-bold text-[var(--color-accent)]">★ {avgRating}</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {rateDist.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-accent)] w-3 shrink-0">{star}</span>
                  <div className="flex-1"><Bar value={count} max={maxRateCount} color="var(--color-accent)" /></div>
                  <span className="text-[11px] text-[var(--color-muted)] w-4 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* top rated */}
          {ratedBooks.length > 0 && (
            <div className="glass rounded-2xl p-5 border border-[var(--color-border)]">
              <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-4">별점 높은 책</p>
              <div className="flex flex-col gap-3">
                {[...ratedBooks].sort((a, b) => b.rating - a.rating).slice(0, 5).map(book => (
                  <div key={book.id} className="flex items-center gap-3">
                    <div className="w-8 h-11 rounded-md overflow-hidden bg-[var(--color-surface-2)] shrink-0">
                      {book.cover
                        ? <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-[var(--color-surface-3)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text)] truncate">{book.title}</p>
                      <p className="text-[10px] text-[var(--color-muted)] truncate">{book.author}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: book.rating }).map((_, i) => (
                        <span key={i} className="text-[10px] text-[var(--color-accent)]">★</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
