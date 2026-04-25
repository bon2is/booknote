import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import type { Book } from './lib/types';
import { useBooks } from './hooks/useBooks';
import { useTheme } from './hooks/useTheme';
import BottomNav, { type TabId } from './components/BottomNav';
import BookDetail from './components/BookDetail';
import AdBanner from './components/AdBanner';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import ScanPage from './pages/ScanPage';
import StatsPage from './pages/StatsPage';

export default function App() {
  const [tab, setTab]           = useState<TabId>('home');
  const [selected, setSelected] = useState<Book | null>(null);

  const { books, addBook, updateBook, deleteBook } = useBooks();
  const { theme, toggleTheme } = useTheme();

  const handleBookClick = (book: Book) => setSelected(book);
  const handleClose     = () => setSelected(null);

  return (
    <div className="relative h-full overflow-hidden bg-[var(--color-bg)] flex flex-col">
      {/* 상단 광고 배너 — 닫으면 max-height:0 으로 공간 없이 사라짐 */}
      <AdBanner />

      {/* Theme toggle — fixed top-right, visible on all pages */}
      <button
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center
          transition-all duration-200
          bg-[var(--color-surface-2)] border border-[var(--color-border)]
          text-[var(--color-muted)] hover:text-[var(--color-accent)]
          hover:border-[var(--color-accent)] hover:scale-110 active:scale-95"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-none">
        {tab === 'home'    && <HomePage    books={books} onBookClick={handleBookClick} onScanClick={() => setTab('scan')} />}
        {tab === 'library' && <LibraryPage books={books} onBookClick={handleBookClick} />}
        {tab === 'scan'    && <ScanPage    onAdd={addBook} onBookClick={handleBookClick} />}
        {tab === 'stats'   && <StatsPage   books={books} />}
      </div>

      <BottomNav current={tab} onChange={setTab} />

      {selected && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleClose}
          />
          <BookDetail
            book={selected}
            onClose={handleClose}
            onUpdate={async (id, input) => {
              await updateBook(id, input);
              setSelected(prev => prev ? { ...prev, ...input } : null);
            }}
            onDelete={async (id) => {
              await deleteBook(id);
              setSelected(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
