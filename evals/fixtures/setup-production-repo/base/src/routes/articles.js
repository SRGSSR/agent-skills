import { listArticles } from '../db.js';

export async function handleArticles(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const page = Number(url.searchParams.get('page') || 1);
  const tag = url.searchParams.get('tag');
  const articles = await listArticles({ page, tag });
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ page, articles }));
}
