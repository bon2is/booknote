export type BookStatus = 'want' | 'reading' | 'done';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  cover: string;
  publisher: string;
  publishedYear: string;
  description: string;
  status: BookStatus;
  rating: number;
  memo: string;
  addedAt: number;
  finishedAt?: number;
}

export type CreateBookInput = Omit<Book, 'id' | 'addedAt'>;
export type UpdateBookInput = Partial<Omit<Book, 'id' | 'addedAt'>>;
