const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

function createStaticServer(appTitle, publicDir, port) {
  const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://localhost:${port}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    let filePath = path.join(publicDir, pathname);

    // If directory or doesn't exist, try index.html (SPA fallback)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(publicDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Internal Server Error: ${err.message}`);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ [${appTitle}] running at http://localhost:${port}`);
  });

  return server;
}

console.log('🌐 Starting Miftah 360 Web Applications Servers...');

const adminServer = createStaticServer(
  'Miftah Admin Dashboard',
  path.resolve('apps/admin-web/public'),
  3001
);

const workshopServer = createStaticServer(
  'Workshop OS',
  path.resolve('apps/workshop-web/public'),
  3002
);

const mobileServer = createStaticServer(
  'Mobile UI Preview',
  path.resolve('apps/mobile/public'),
  3003
);

process.on('SIGINT', () => {
  console.log('Shutting down frontend servers...');
  adminServer.close();
  workshopServer.close();
  mobileServer.close();
  process.exit(0);
});

