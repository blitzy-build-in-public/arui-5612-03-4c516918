// A minimal, dependency-free Node.js HTTP server: GET /hello answers 200, every other request answers 404.

const http = require('node:http');

const DEFAULT_PORT = 3000;
const MIN_PORT = 1024;
const MAX_PORT = 65535;
const CONTENT_TYPE = 'text/plain';
const HELLO_BODY = 'Hello world';
const NOT_FOUND_BODY = 'Not Found';

let resolvedPort = null;
let server = null;
let shuttingDown = false;

function resolvePort(rawValue) {
  if (rawValue === undefined) {
    return DEFAULT_PORT;
  }

  const trimmedValue = rawValue.trim();

  if (trimmedValue === '') {
    return DEFAULT_PORT;
  }

  if (/^\d+$/.test(trimmedValue)) {
    const candidatePort = Number(trimmedValue);

    if (candidatePort >= MIN_PORT && candidatePort <= MAX_PORT) {
      return candidatePort;
    }
  }

  throw new Error('Invalid PORT value "' + rawValue + '": expected an integer between ' +
    MIN_PORT + ' and ' + MAX_PORT + '.');
}

function logRequest(req) {
  console.log(new Date().toISOString() + ' ' + req.method + ' ' + req.url);
}

function sendPlainText(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', CONTENT_TYPE);
  res.end(body);
}

function handleHello(req, res) {
  sendPlainText(res, 200, HELLO_BODY);
}

function handleRequest(req, res) {
  logRequest(req);

  let pathname;

  // Parsing the target keeps a query string from defeating the exact-path match: req.url may carry "?name=world".
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch {
    pathname = null;
  }

  if (req.method === 'GET' && pathname === '/hello') {
    handleHello(req, res);
    return;
  }

  sendPlainText(res, 404, NOT_FOUND_BODY);
}

function handleServerError(err, port) {
  if (err.code === 'EADDRINUSE') {
    console.error('Failed to start server: port ' + port + ' is already in use. ' +
      'Stop the process using it, or choose another port, for example: PORT=3001 npm start');
  } else {
    console.error('Failed to start server on port ' + port + ': ' + err.message);
  }

  process.exitCode = 1;
}

function handleSigint() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log('Received SIGINT, shutting down server');

  server.close(function onClosed(err) {
    if (err) {
      console.error('Failed to close server: ' + err.message);
      process.exitCode = 1;
      return;
    }

    console.log('Server closed');
    // Setting the exit status rather than force-exiting keeps buffered console output from being cut off.
    process.exitCode = 0;
  });

  // Both methods arrived in Node.js 18.2.0, above the declared 18.0.0 floor, so each is checked before it is called.
  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }

  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }
}

try {
  resolvedPort = resolvePort(process.env.PORT);
} catch (error) {
  console.error('Configuration error: ' + error.message);
  process.exitCode = 1;
}

if (resolvedPort !== null) {
  server = http.createServer(handleRequest);

  server.on('error', function onServerError(err) {
    handleServerError(err, resolvedPort);
  });

  process.on('SIGINT', handleSigint);

  server.listen(resolvedPort, function onListening() {
    console.log('Server listening on port ' + resolvedPort);
  });
}
