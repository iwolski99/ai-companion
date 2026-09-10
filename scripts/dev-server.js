/**
 * Local Buddy server: static public/ + Netlify functions.
 * Usage: NODE_PATH=./node_modules node scripts/dev-server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT || 4173);

const search = require('../netlify/functions/search');
const thumbnail = require('../netlify/functions/thumbnail');
const redgifs = require('../netlify/functions/redgifs');
const gifmedia = require('../netlify/functions/gifmedia');
const buddy = require('../netlify/functions/buddy');
const vault = require('../netlify/functions/vault');

const ROUTES = {
  '/api/search': search,
  '/api/thumbnail': thumbnail,
  '/api/redgifs': redgifs,
  '/api/gifmedia': gifmedia,
  '/api/buddy': buddy,
  '/api/vault': vault,
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8') || null));
    req.on('error', reject);
  });
}

function toEvent(req, url, body) {
  const headers = {};
  for (const [k, v] of Object.entries(req.headers || {})) {
    headers[k.toLowerCase()] = v;
  }
  const qs = {};
  url.searchParams.forEach((val, key) => {
    qs[key] = val;
  });
  return {
    httpMethod: req.method,
    headers,
    queryStringParameters: qs,
    path: url.pathname,
    body,
  };
}

async function invoke(handler, req, res, url) {
  const body = ['POST', 'PUT', 'PATCH'].includes(req.method)
    ? await readBody(req)
    : null;
  const event = toEvent(req, url, body);
  const result = await handler.handler(event);
  const headers = result.headers || {};
  res.statusCode = result.statusCode || 200;
  for (const [k, v] of Object.entries(headers)) {
    if (v != null) res.setHeader(k, v);
  }
  if (result.isBase64Encoded) {
    res.end(Buffer.from(result.body || '', 'base64'));
  } else {
    res.end(result.body || '');
  }
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  if (path.basename(filePath) === 'redgifs.html' || path.basename(filePath) === 'foryou.html') {
    res.setHeader('Referrer-Policy', 'no-referrer');
  }
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const api = ROUTES[url.pathname];
    if (api) {
      await invoke(api, req, res, url);
      return;
    }
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';
    const filePath = path.join(ROOT, rel);
    if (!filePath.startsWith(ROOT)) {
      res.statusCode = 403;
      res.end('forbidden');
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    sendFile(res, filePath);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end(err.stack || String(err));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`buddy-dev http://127.0.0.1:${PORT}/`);
});
