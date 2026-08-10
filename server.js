const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };

// Three fixed rental units. Hardcoded on purpose — keeps the project small
// and focused on the testing practices it's meant to demonstrate.
const UNITS = [
  {
    id: 1,
    name: 'Harbourview Studio',
    type: 'Studio',
    rent: 1350,
    description: 'A bright, compact studio a short walk from the waterfront. Ideal for a single tenant or couple.',
  },
  {
    id: 2,
    name: 'Maple Street 1-Bedroom',
    type: '1 Bed / 1 Bath',
    rent: 1650,
    description: 'Quiet residential unit with in-suite laundry and a private balcony.',
  },
  {
    id: 3,
    name: 'The Birchwood Townhouse',
    type: '2 Bed / 1.5 Bath',
    rent: 2200,
    description: 'Two-storey townhouse with a small fenced yard, close to schools and transit.',
  },
];

const UNIT_IDS = new Set(UNITS.map((u) => u.id));

/**
 * Creates an HTTP server backed by SQLite (for booking inquiries).
 * @param {string} dbPath - path to the sqlite file, or ':memory:' for tests.
 */
function createApp(dbPath = ':memory:') {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT,
      created_at TEXT NOT NULL
    )
  `);

  function sendJSON(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
  }

  function serveStatic(res, pathname) {
    const rel = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.join(PUBLIC_DIR, rel);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function listInquiries() {
    return db
      .prepare('SELECT id, unit_id, name, email, message, created_at FROM inquiries ORDER BY id DESC')
      .all();
  }

  function addInquiry({ unitId, name, email, message }) {
    const createdAt = new Date().toISOString();
    const result = db
      .prepare('INSERT INTO inquiries (unit_id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(unitId, name, email, message || '', createdAt);
    return {
      id: Number(result.lastInsertRowid),
      unit_id: unitId,
      name,
      email,
      message: message || '',
      created_at: createdAt,
    };
  }

  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname === '/api/units' && req.method === 'GET') {
      return sendJSON(res, 200, UNITS);
    }

    if (pathname === '/api/inquiries' && req.method === 'GET') {
      return sendJSON(res, 200, listInquiries());
    }

    if (pathname === '/api/inquiries' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(body || '{}');
        } catch {
          return sendJSON(res, 400, { error: 'Invalid JSON body' });
        }

        const unitId = Number(parsed.unitId);
        const name = String(parsed.name || '').trim();
        const email = String(parsed.email || '').trim();
        const message = String(parsed.message || '').trim();

        if (!UNIT_IDS.has(unitId)) {
          return sendJSON(res, 400, { error: 'unitId must refer to an existing unit' });
        }
        if (!name || !email) {
          return sendJSON(res, 400, { error: 'name and email are required' });
        }
        if (!isValidEmail(email)) {
          return sendJSON(res, 400, { error: 'email must be a valid email address' });
        }

        return sendJSON(res, 201, addInquiry({ unitId, name, email, message }));
      });
      return;
    }

    if (req.method === 'GET') {
      return serveStatic(res, pathname);
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.on('close', () => db.close());
  server._db = db;
  return server;
}

module.exports = { createApp, UNITS };

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const dbFile = process.env.DB_PATH || path.join(__dirname, 'rentals.db');
  const server = createApp(dbFile);
  server.listen(PORT, () => console.log(`Rental listing site running at http://localhost:${PORT}`));
}
