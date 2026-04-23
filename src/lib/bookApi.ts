import type { CreateBookInput } from './types';

async function fetchFromOpenLibrary(isbn: string): Promise<CreateBookInput | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    const data = await res.json() as Record<string, unknown>;
    const key = `ISBN:${isbn}`;
    const book = data[key] as Record<string, unknown> | undefined;
    if (!book) return null;

    const authors = (book.authors as Array<{ name: string }> | undefined) ?? [];
    const publishers = (book.publishers as Array<{ name: string }> | undefined) ?? [];
    const cover = (book.cover as { large?: string; medium?: string } | undefined);
    const excerpts = (book.excerpts as Array<{ text: string }> | undefined) ?? [];

    return {
      isbn,
      title: (book.title as string) ?? '',
      author: authors.map(a => a.name).join(', '),
      cover: cover?.large ?? cover?.medium ?? '',
      publisher: publishers[0]?.name ?? '',
      publishedYear: ((book.publish_date as string) ?? '').slice(0, 4),
      description: excerpts[0]?.text ?? '',
      status: 'want',
      rating: 0,
      memo: '',
    };
  } catch {
    return null;
  }
}

async function fetchFromGoogleBooks(isbn: string): Promise<CreateBookInput | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`
    );
    const data = await res.json() as { items?: Array<{ volumeInfo: Record<string, unknown> }> };
    const vol = data.items?.[0]?.volumeInfo;
    if (!vol) return null;

    const imageLinks = vol.imageLinks as { thumbnail?: string } | undefined;
    const thumbnail = imageLinks?.thumbnail?.replace('http:', 'https:') ?? '';

    return {
      isbn,
      title: (vol.title as string) ?? '',
      author: ((vol.authors as string[]) ?? []).join(', '),
      cover: thumbnail,
      publisher: (vol.publisher as string) ?? '',
      publishedYear: ((vol.publishedDate as string) ?? '').slice(0, 4),
      description: (vol.description as string) ?? '',
      status: 'want',
      rating: 0,
      memo: '',
    };
  } catch {
    return null;
  }
}

export async function fetchBookByIsbn(isbn: string): Promise<CreateBookInput | null> {
  const result = await fetchFromOpenLibrary(isbn);
  if (result && result.title) return result;
  return fetchFromGoogleBooks(isbn);
}
