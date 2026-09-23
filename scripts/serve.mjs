const assets = new Map([
  ['index.html', 'text/html'], ['styles.css', 'text/css'],
  ['app.js', 'text/javascript'], ['classifier.js', 'text/javascript'], ['mark.svg', 'image/svg+xml']
]);
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch(request) {
    const path = new URL(request.url).pathname;
    const name = path === '/' || path === '/gauge-console/' ? 'index.html' : path.replace(/^\/(?:gauge-console\/)?/, '');
    const type = assets.get(name);
    if (!type) return new Response('Not found', { status: 404 });
    return new Response(Bun.file(new URL(`../public/${name}`, import.meta.url)), {
      headers: { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
    });
  }
});
console.log(`Gauge Console preview: ${server.url}gauge-console/`);
