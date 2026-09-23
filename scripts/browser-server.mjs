import { verify } from './verify.mjs';

const { cases, metadata } = await verify();
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/') return new Response('<!doctype html><title>Gauge classifier verification</title>', { headers: { 'Content-Type': 'text/html' } });
    if (path === '/classifier.js') return new Response(Bun.file(new URL('../public/classifier.js', import.meta.url)), { headers: { 'Content-Type': 'text/javascript' } });
    if (path === '/cases.json') return Response.json({ cases, metadata });
    return new Response('Not found', { status: 404 });
  }
});
console.log(`Verification server: ${server.url}`);
