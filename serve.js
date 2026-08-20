/* Tiny static server. Run:  node serve.js
   Then open the printed http://<your-mac-ip>:8899 on your iPhone. */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const PORT = process.env.PORT || 8899, ROOT = __dirname;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8', '.png':'image/png',
  '.svg':'image/svg+xml', '.ico':'image/x-icon' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('no'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(buf);
  });
}).listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\n  Lean is serving.\n');
  console.log('  On this Mac:   http://localhost:' + PORT);
  ips.forEach(ip => console.log('  On your phone: http://' + ip + ':' + PORT + '   (same Wi-Fi)'));
  console.log('\n  Ctrl-C to stop.\n');
});
