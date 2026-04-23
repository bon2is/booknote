import { useState } from 'react';
import type { Book } from './lib/types';
import { useBooks } from './hooks/useBooks';
import BottomNav, { type TabId } from './components/BottomNav';
import BookDetail from './components/BookDetail';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import ScanPage from './pages/ScanPage';
import StatsPage from './pages/StatsPage';

export default function App() {
  const [tab, setTab]           = useState<TabId>('home');
  const [selected, setSelected] = useState<Book | null>(null);

  const { books, addBook, updateBook, deleteBook } = useBooks();

  const handleBookClick = (book: Book) => setSelected(book);
  const handleClose     = () => setSelected(null);

  return (
    <div className="relative h-full overflow-hidden bg-[var(--color-bg)]">
      <div className="h-full overflow-y-auto overscroll-none">
        {tab === 'home'    && <HomePage    books={books} onBookClick={handleBookClick} />}
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
