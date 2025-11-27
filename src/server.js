const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, '..', 'data', 'store.json');
const PUBLIC_PATH = path.join(__dirname, '..', 'public');

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.updated_date) {
      parsed.updated_date = new Date().toISOString();
      persistData(parsed);
    }
    return parsed;
  } catch (error) {
    const fallback = {
      updated_date: new Date().toISOString(),
      file_url: 'https://github.com/fedelagarmilla/qhh-revista/blob/main/QHH-327.pdf',
      title: 'QHH - 327'
    };
    persistData(fallback);
    return fallback;
  }
}

function persistData(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

const state = loadData();

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function serveStatic(res, filepath) {
  const resolvedPath = path.join(PUBLIC_PATH, filepath);
  if (!resolvedPath.startsWith(PUBLIC_PATH)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(resolvedPath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const contentType = resolvedPath.endsWith('.js')
      ? 'application/javascript'
      : 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/info') {
    sendJson(res, 200, state);
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/info') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.connection.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const updates = {};

        if (typeof payload.file_url === 'string' && payload.file_url.trim()) {
          updates.file_url = payload.file_url.trim();
        }

        if (typeof payload.title === 'string' && payload.title.trim()) {
          updates.title = payload.title.trim();
        }

        if (!updates.file_url && !updates.title) {
          sendJson(res, 400, { error: 'Provide a file_url or title to update.' });
          return;
        }

        const now = new Date().toISOString();
        const newState = { ...state, ...updates, updated_date: now };
        Object.assign(state, newState);
        persistData(state);

        sendJson(res, 200, state);
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid JSON payload.' });
      }
    });
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    serveStatic(res, 'index.html');
    return;
  }

  if (req.method === 'GET') {
    const filePath = url.pathname.slice(1);
    if (filePath) {
      serveStatic(res, filePath);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
