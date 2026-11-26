@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel%==0 (
  node -e "const s=require('fs').readFileSync(process.argv[1],'utf8').split('/*__NODE_'+'START__*/')[1]; new Function('require','process','__dirname',s)(require,process,process.cwd());" "%~f0" %*
  exit /b %errorlevel%
)

set "NO_OPEN="
for %%A in (%*) do (
  if "%%~A"=="--no-open" set "NO_OPEN=1"
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Servidor local en http://localhost:8080/ (Ctrl+C para detener)
  if not defined NO_OPEN start "" "http://localhost:8080/"
  py -m http.server 8080 --bind 127.0.0.1
  exit /b %errorlevel%
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Servidor local en http://localhost:8080/ (Ctrl+C para detener)
  if not defined NO_OPEN start "" "http://localhost:8080/"
  python -m http.server 8080 --bind 127.0.0.1
  exit /b %errorlevel%
)

echo No se encontro Node.js ni Python para iniciar el servidor local.
echo Puedes abrir index.html directamente en tu navegador o instalar Node.js / Python.
pause
exit /b 1

/*__NODE_START__*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname);
const args = process.argv.slice(2);
const noOpen = args.includes('--no-open');
const basePort = 8080;
const maxPort = 8099;

const MIME_TYPES = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.js':    'application/javascript; charset=utf-8',
  '.svg':   'image/svg+xml; charset=utf-8',
  '.json':  'application/json; charset=utf-8',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.woff2': 'font/woff2',
  '.woff':  'font/woff',
  '.ico':   'image/x-icon',
};

function resolveSafePath(requestUrl) {
  const parsed = new URL(requestUrl, 'http://127.0.0.1');
  const pathname = decodeURIComponent(parsed.pathname);
  if (pathname.includes('\0')) return null;

  const relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let targetPath = path.resolve(root, relPath);
  if (targetPath !== root && !targetPath.startsWith(root + path.sep)) {
    return 'FORBIDDEN';
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(targetPath, 'index.html');
  }

  return targetPath;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  let targetPath;
  try {
    targetPath = resolveSafePath(req.url || '/');
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  if (!targetPath || targetPath === 'FORBIDDEN') {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(targetPath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Archivo no encontrado');
      return;
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(targetPath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Internal Server Error');
    });
    stream.pipe(res);
  });
});

function openBrowser(url) {
  const child = spawn('cmd', ['/c', 'start', '', url], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

function startOnPort(port) {
  const onError = (err) => {
    if (err.code === 'EADDRINUSE' && port < maxPort) {
      server.removeListener('error', onError);
      startOnPort(port + 1);
      return;
    }
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  };

  server.once('error', onError);
  server.listen(port, '127.0.0.1', () => {
    server.removeListener('error', onError);
    const url = `http://localhost:${port}/`;
    console.log('==============================================');
    console.log('  PokeMMO Farm Guide - Servidor local activo');
    console.log(`  URL: ${url}`);
    console.log(`  Carpeta: ${root}`);
    console.log('  Pulsa Ctrl+C para detener el servidor.');
    console.log('==============================================');
    if (!noOpen) {
      openBrowser(url);
    }
  });
}

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

startOnPort(basePort);
