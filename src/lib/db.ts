import { openDB, type IDBPDatabase } from 'idb';
import type { Book, UpdateBookInput } from './types';

const DB_NAME = 'booknote';
const DB_VERSION = 1;
const STORE = 'books';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('addedAt', 'addedAt');
      },
    });
  }
  return dbPromise;
}

export async function getBooks(): Promise<Book[]> {
  const db = await getDB();
  const books = await db.getAll(STORE) as Book[];
  return books.sort((a, b) => b.addedAt - a.addedAt);
}

export async function getBookByIsbn(isbn: string): Promise<Book | undefined> {
  const db = await getDB();
  const all = await db.getAll(STORE) as Book[];
  return all.find(b => b.isbn === isbn);
}

export async function addBook(book: Book): Promise<void> {
  const db = await getDB();
  await db.put(STORE, book);
}

export async function updateBook(id: string, updates: UpdateBookInput): Promise<Book> {
  const db = await getDB();
  const existing = await db.get(STORE, id) as Book;
  if (!existing) throw new Error(`Book ${id} not found`);
  const updated: Book = { ...existing, ...updates };
  await db.put(STORE, updated);
  return updated;
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
}
