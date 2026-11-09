# Node.js Hello World HTTP Server

A minimal HTTP server built with Node.js built-in modules only, small enough to read in one sitting.

## Purpose

This project is a working server and a teaching example at the same time. It answers `GET /hello` with `Hello world` and answers every other request with `Not Found`, using nothing but the built-in `http` module: no framework, no middleware and no routing library.

Reading `server.js` shows the whole request path in one file: one hand-written route, an explicit fallback for everything else, plain-text responses with an explicit status code and `Content-Type`, one console line per request, and a shutdown that closes the server cleanly when you press `CTRL+C`.

## Prerequisites

Node.js v18.0.0 or later. Check the version you have installed:

```bash
node --version
```

Nothing else is required. `npm start`, one of the two ways to run the server below, ships with Node.js and needs no separate setup.

## Installation

None is required beyond Node.js. The project declares no dependencies, so there is nothing to install, no `npm install` step to run and no `node_modules` directory to manage.

## Running the server

Run either command from the project root:

```bash
node server.js
```

```bash
npm start
```

Both start the same server on port `3000` by default, and both keep running in the foreground until you stop them. The server's first line is the startup confirmation:

```bash
Server listening on port 3000
```

`npm start` prints a blank line and its own header lines before that, so the startup line is not the first line of its output:

```bash
> nodejs-tutorial-hello-world@1.0.0 start
> node server.js
```

No install step goes before either command.

The server binds every network interface on the machine, not only `localhost`, so any host that can reach this machine on the chosen port can reach it; it has no authentication and is intended for local development only.

## Testing

Leave the server running in one terminal and run these commands in a second one. The `-i` option makes `curl` print the response status line and headers as well as the response body.

Request the one defined route:

```bash
curl http://localhost:3000/hello
```

The response is `200 OK` and the body is `Hello world`.

Request any other path:

```bash
curl -i http://localhost:3000/invalid
```

The response is `404 Not Found` and the body is `Not Found`.

Request the defined route with a different method:

```bash
curl -i -X POST http://localhost:3000/hello
```

The response is again `404 Not Found` with the body `Not Found`. The route matches the method `GET` and the pathname `/hello` together, so a request with a different method does not match it and falls through to the same fallback that answers an unknown path.

## Expected output

The server confirms the bind with `Server listening on port 3000`, and it writes one line per request. The line is the ISO-8601 timestamp, the HTTP method and the request target:

```bash
2026-11-09T07:39:13.019Z GET /hello
```

The timestamp is ISO-8601 in UTC with milliseconds, from `new Date().toISOString()`. The line is written before the request is routed, so every request produces one line, whether it is served by the route or answered by the fallback. The third field is the request target exactly as the server received it, so a query string appears in the line too:

```bash
2026-11-09T07:39:13.043Z GET /hello?name=world
```

A request to `GET /hello` returns `200 OK`:

```bash
HTTP/1.1 200 OK
Content-Type: text/plain
Date: Mon, 09 Nov 2026 07:39:13 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 11

Hello world
```

The body is `Hello world`, 11 bytes, with no trailing newline. The `Date` value is the current time in HTTP-date format, added by Node. It is generated for each response and resolved to whole seconds, so two responses served in the same second carry the same value, and it is not the fixed value shown above.

A request to any other path, and a request to `/hello` with a method other than `GET`, returns `404 Not Found`:

```bash
HTTP/1.1 404 Not Found
Content-Type: text/plain
Date: Mon, 09 Nov 2026 07:39:13 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 9

Not Found
```

The body is `Not Found`, 9 bytes, again with no trailing newline.

Only `Content-Type` is set by the application. `Content-Length`, `Date`, `Connection` and `Keep-Alive` are added by Node.

## Shutdown

Press `CTRL+C` in the terminal that is running the server. That sends `SIGINT`, and the server prints two lines in this order:

```bash
Received SIGINT, shutting down server
Server closed
```

The server closes its connections as part of the shutdown, and the process then exits with status `0`.

## Configuration

The server reads one environment variable, `PORT`, which sets the port it binds.

- The default is `3000`, used when `PORT` is unset, empty or whitespace only.
- The accepted range is `1024` to `65535`, inclusive.
- A value padded with whitespace is trimmed to the number it wraps, so `PORT=' 4000 '` binds port `4000`.

To run on another port, set `PORT` for the command:

```bash
PORT=4000 npm start
```

The startup confirmation then names the port that was bound:

```bash
Server listening on port 4000
```

The server is then reachable at `http://localhost:4000/hello`.

A port below `1024` is refused as a configuration error, which is how the server declines privileged ports without attempting to bind them. Any value that is not an integer in the accepted range is rejected with an actionable message and exit status `1`, and the server does not start — the only exception being an unset, empty or whitespace-only value, which takes the default `3000` described above. For example, `PORT=abc` prints:

```bash
Configuration error: Invalid PORT value "abc": expected an integer between 1024 and 65535.
```
