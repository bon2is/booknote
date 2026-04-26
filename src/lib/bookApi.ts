import type { CreateBookInput } from './types';

// 각 API 요청에 적용할 타임아웃 (ms)
const FETCH_TIMEOUT = 5000;

function timedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

// ── 1. Kakao Books API ──────────────────────────────────────────────────────
// Free, no auth needed for ISBN search via REST API key (set VITE_KAKAO_REST_KEY)
// Excellent Korean book coverage. Falls back silently if key not configured.
async function fetchFromKakaoBooks(isbn: string): Promise<CreateBookInput | null> {
  const key = import.meta.env.VITE_KAKAO_REST_KEY as string | undefined;
  if (!key) return null;
  try {
    const res = await timedFetch(
      `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(isbn)}&target=isbn`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      documents?: Array<{
        title: string;
        authors: string[];
        thumbnail: string;
        publisher: string;
        datetime: string;
        contents: string;
        isbn: string;
      }>;
    };
    const doc = data.documents?.[0];
    if (!doc || !doc.title) return null;

    return {
      isbn,
      title: doc.title,
      author: doc.authors.join(', '),
      cover: doc.thumbnail,
      publisher: doc.publisher,
      publishedYear: doc.datetime ? doc.datetime.slice(0, 4) : '',
      description: doc.contents,
      status: 'want',
      rating: 0,
      memo: '',
    };
  } catch {
    return null;
  }
}

// ── 2. Naver Books API ──────────────────────────────────────────────────────
// Free key via https://developers.naver.com — requires VITE_NAVER_CLIENT_ID
// and VITE_NAVER_CLIENT_SECRET. Excellent Korean coverage.
async function fetchFromNaverBooks(isbn: string): Promise<CreateBookInput | null> {
  const clientId     = import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined;
  const clientSecret = import.meta.env.VITE_NAVER_CLIENT_SECRET as string | undefined;
  if (!clientId || !clientSecret) return null;
  try {
    const res = await timedFetch(
      `https://openapi.naver.com/v1/search/book_adv.json?d_isbn=${isbn}`,
      {
        headers: {
          'X-Naver-Client-Id':     clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      items?: Array<{
        title: string;
        author: string;
        image: string;
        publisher: string;
        pubdate: string;
        description: string;
      }>;
    };
    const item = data.items?.[0];
    if (!item || !item.title) return null;

    // Strip HTML tags from Naver descriptions
    const stripTags = (s: string) => s.replace(/<[^>]*>/g, '');

    return {
      isbn,
      title: stripTags(item.title),
      author: stripTags(item.author),
      cover: item.image,
      publisher: item.publisher,
      publishedYear: item.pubdate ? item.pubdate.slice(0, 4) : '',
      description: stripTags(item.description),
      status: 'want',
      rating: 0,
      memo: '',
    };
  } catch {
    return null;
  }
}

// ── 3. Open Library — direct ISBN lookup ────────────────────────────────────
async function fetchFromOpenLibrary(isbn: string): Promise<CreateBookInput | null> {
  try {
    const res = await timedFetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    if (!res.ok) return null;
    const data = await res.json() as Record<string, unknown>;
    const key  = `ISBN:${isbn}`;
    const book = data[key] as Record<string, unknown> | undefined;
    if (!book) return null;

    const authors    = (book.authors    as Array<{ name: string }> | undefined) ?? [];
    const publishers = (book.publishers as Array<{ name: string }> | undefined) ?? [];
    const cover      = (book.cover      as { large?: string; medium?: string } | undefined);
    const excerpts   = (book.excerpts   as Array<{ text: string }> | undefined) ?? [];

    return {
      isbn,
      title:         (book.title as string) ?? '',
      author:        authors.map(a => a.name).join(', '),
      cover:         cover?.large ?? cover?.medium ?? '',
      publisher:     publishers[0]?.name ?? '',
      publishedYear: ((book.publish_date as string) ?? '').slice(0, 4),
      description:   excerpts[0]?.text ?? '',
      status: 'want',
      rating: 0,
      memo: '',
    };
  } catch {
    return null;
  }
}

// ── 4. Open Library — full-text search fallback ──────────────────────────────
async function fetchFromOpenLibrarySearch(isbn: string): Promise<CreateBookInput | null> {
  try {
    const res = await timedFetch(
      `https://openlibrary.org/search.json?isbn=${isbn}&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      docs?: Array<{
        title?: string;
        author_name?: string[];
        publisher?: string[];
        first_publish_year?: number;
        cover_i?: number;
      }>;
    };
    const doc = data.docs?.[0];
    if (!doc || !doc.title) return null;

    const cover = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : '';

    return {
      isbn,
      title:         doc.title,
      author:        (doc.author_name ?? []).join(', '),
      cover,
      publisher:     doc.publisher?.[0] ?? '',
      publishedYear: doc.first_publish_year ? String(doc.first_publish_year) : '',
      description:   '',
      status: 'want',
      rating: 0,
      memo: '',
    };
  } catch {
    return null;
  }
}

// ── 5. Google Books API ──────────────────────────────────────────────────────
// Tries isbn:{isbn} first, then bare {isbn} as fallback (better hit rate).
async function fetchFromGoogleBooks(isbn: string): Promise<CreateBookInput | null> {
  const queries = [`isbn:${isbn}`, isbn];

  for (const q of queries) {
    try {
      const res = await timedFetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`
      );
      if (!res.ok) continue;
      const data = await res.json() as {
        items?: Array<{ volumeInfo: Record<string, unknown> }>;
      };
      const vol = data.items?.[0]?.volumeInfo;
      if (!vol || !(vol.title as string)) continue;

      const imageLinks = vol.imageLinks as { thumbnail?: string } | undefined;
      const thumbnail  = imageLinks?.thumbnail?.replace('http:', 'https:') ?? '';

      return {
        isbn,
        title:         (vol.title as string) ?? '',
        author:        ((vol.authors as string[]) ?? []).join(', '),
        cover:         thumbnail,
        publisher:     (vol.publisher as string) ?? '',
        publishedYear: ((vol.publishedDate as string) ?? '').slice(0, 4),
        description:   (vol.description as string) ?? '',
        status: 'want',
        rating: 0,
        memo: '',
      };
    } catch {
      continue;
    }
  }
  return null;
}

// ── Public entry point ───────────────────────────────────────────────────────
// Priority: Kakao → Naver → Open Library (direct) → Open Library (search) → Google Books
export async function fetchBookByIsbn(isbn: string): Promise<CreateBookInput | null> {
  // Strip hyphens for API compatibility
  const clean = isbn.replace(/-/g, '');

  const kakao = await fetchFromKakaoBooks(clean);
  if (kakao?.title) return kakao;

  const naver = await fetchFromNaverBooks(clean);
  if (naver?.title) return naver;

  const ol = await fetchFromOpenLibrary(clean);
  if (ol?.title) return ol;

  const olSearch = await fetchFromOpenLibrarySearch(clean);
  if (olSearch?.title) return olSearch;

  return fetchFromGoogleBooks(clean);
}
