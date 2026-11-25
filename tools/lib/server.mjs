// Serves dist/ on a free local port with the security headers from dist/.htaccess.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".ttf": "font/ttf", ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8", ".xml": "text/xml"
};

export function productionHeaders(dist) {
  const rules = readFileSync(join(dist, ".htaccess"), "utf8").matchAll(/Header always set (\S+) "([^"]+)"/g);
  return Object.fromEntries([...rules].map(([, name, value]) => [name, value]).filter(([name]) => name !== "Strict-Transport-Security"));
}

export async function serve(dist, port = 0) {
  const headers = productionHeaders(dist);
  const server = createServer(async (request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, "http://x").pathname));
    try {
      const body = await readFile(join(dist, path.endsWith("/") ? `${path}index.html` : path));
      response.writeHead(200, { ...headers, "Content-Type": TYPES[extname(path) || ".html"] ?? "application/octet-stream" }).end(body);
    } catch {
      response.writeHead(404).end("not found");
    }
  });
  await new Promise(done => { server.listen(port, "127.0.0.1", done); });
  return { url: `http://localhost:${server.address().port}`, close: () => server.close() };
}
