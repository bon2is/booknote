import { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Book, BookStatus, CreateBookInput, UpdateBookInput } from '../lib/types';
import * as db from '../lib/db';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await db.getBooks();
    setBooks(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addBook = useCallback(async (input: CreateBookInput): Promise<Book> => {
    const existing = await db.getBookByIsbn(input.isbn);
    if (existing) return existing;
    const book: Book = { ...input, id: uuidv4(), addedAt: Date.now() };
    await db.addBook(book);
    setBooks(prev => [book, ...prev]);
    return book;
  }, []);

  const updateBook = useCallback(async (id: string, updates: UpdateBookInput): Promise<void> => {
    const updated = await db.updateBook(id, updates);
    setBooks(prev => prev.map(b => b.id === id ? updated : b));
  }, []);

  const deleteBook = useCallback(async (id: string): Promise<void> => {
    await db.deleteBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
  }, []);

  const markStatus = useCallback(async (id: string, status: BookStatus): Promise<void> => {
    const updates: UpdateBookInput = { status };
    if (status === 'done') updates.finishedAt = Date.now();
    await updateBook(id, updates);
  }, [updateBook]);

  return { books, loading, addBook, updateBook, deleteBook, markStatus, reload: load };
}
