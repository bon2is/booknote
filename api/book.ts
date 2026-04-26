import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel 서버리스 함수 — Kakao Books API를 서버-서버로 프록시
// CORS 문제 없이 API 키를 안전하게 사용
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const isbn = req.query.isbn as string | undefined;
  if (!isbn) return res.status(400).json({ error: 'isbn required' });

  const key = process.env.KAKAO_REST_KEY || process.env.VITE_KAKAO_REST_KEY;
  if (!key) return res.status(503).json({ error: 'Kakao key not configured' });

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(isbn)}&target=isbn`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    );
    if (!response.ok) return res.status(response.status).json({ error: 'Kakao API error' });

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'fetch failed' });
  }
}
