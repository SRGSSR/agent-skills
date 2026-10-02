import http from 'node:http';
import { handleArticles } from './routes/articles.js';

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/articles')) return await handleArticles(req, res);
    res.writeHead(404).end();
  } catch (err) {
    console.error(err);
    res.writeHead(500).end();
  }
});

server.listen(process.env.PORT || 8080);
