import http from 'node:http';

const items = [
  { id: 1, name: 'Microphone stand', qty: 2, tags: ['studio'], createdAt: '2026-09-20' },
  { id: 2, name: 'XLR cable 5m', qty: 10, tags: ['studio', 'cables'], createdAt: '2026-09-21' },
  { id: 3, name: 'Headphones, closed-back', qty: 4, tags: [], createdAt: '2026-09-22' },
];
let nextId = 4;

function page(body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Itemlist</title></head><body>${body}</body></html>`;
}

function renderList() {
  const rows = items
    .map((i) => `<li>${i.name} (${i.qty})${i.tags.length ? ' - ' + i.tags.join(', ') : ''}</li>`)
    .join('');
  return page(`<h1>Items</h1><ul>${rows}</ul>
<form method="post" action="/items">
  <input name="name" placeholder="Name" required>
  <input name="qty" type="number" value="1" min="1">
  <input name="tags" placeholder="tags, comma separated">
  <button>Add</button>
</form>`);
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(renderList());
  }
  if (req.method === 'POST' && req.url === '/items') {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      const form = new URLSearchParams(data);
      items.push({
        id: nextId++,
        name: form.get('name'),
        qty: Number(form.get('qty') || 1),
        tags: (form.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString().slice(0, 10),
      });
      res.writeHead(303, { Location: '/' });
      res.end();
    });
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Itemlist on http://localhost:${port}`));
