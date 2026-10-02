import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const PAGE_SIZE = 20;

export async function listArticles({ page = 1, tag } = {}) {
  const offset = (page - 1) * PAGE_SIZE;
  const params = [PAGE_SIZE, offset];
  let where = '';
  if (tag) {
    params.push(tag);
    where = 'WHERE $3 = ANY(tags)';
  }
  const { rows } = await pool.query(
    `SELECT id, title, published_at FROM articles ${where} ORDER BY published_at DESC LIMIT $1 OFFSET $2`,
    params,
  );
  return rows;
}
