/* gate-harness.mjs — the ONE shared gate harness (AUDIT optimization R5 / Dim-E §3).
 *
 * Replaces the static-file server + `chromium.launch()` + console/error/network attach + fixed-sleep
 * boilerplate that was copy-pasted across the gate suite (24 inline servers, 46 bare launches).
 *
 * Design goals (Dim-E E1–E4):
 *   - serveDir() binds listen(0) → the OS picks a free port. Kills the hardcoded-port collision class
 *     (the :8137 / :8099 history) — no two gates can ever fight over a port again.
 *   - withBrowser() launches Chromium with HARDENED args (--disable-dev-shm-usage …) → kills the
 *     GitHub-Actions 64 MB /dev/shm SIGKILL/OOM class. Always closes in finally.
 *   - withPage() gives each target an isolated context+page, auto-attaches the console/pageerror/network
 *     capture, and ALWAYS closes both in finally (leak-free).
 *   - ready() is a deterministic readiness wait (waitForFunction) to replace fixed waitForTimeout(ms).
 *
 * Consolidation, NOT weakening (HARD CONSTRAINT #4): gates keep every assertion; only plumbing moves here.
 * Offline guarantee (#1) is preserved — the server is bound to 127.0.0.1 (local only) and withPage's
 * `capture.requests` still records every request so a gate can assert "no off-localhost fetch".
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, sep } from 'node:path';

/** Hardened Chromium launch args. The --disable-dev-shm-usage flag is the OOM/SIGKILL fix on CI. */
export const HARDENED = Object.freeze({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.map': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain',
};

/**
 * Serve a directory over HTTP on an OS-assigned free port (listen(0)).
 *
 * @param {string} dir  absolute directory to serve
 * @param {{ base?: string }} [opts]  URL path prefix the built site expects (e.g. the Pages base path).
 *        Requests are matched with-or-without the prefix, so it is safe to leave '' for raw dirs.
 * @returns {Promise<{ port:number, url:string, base:string, href:(p?:string)=>string, close:()=>Promise<void> }>}
 *          url  = http://127.0.0.1:<port>
 *          href = (p) => url + base + '/' + p   (the address to page.goto)
 */
export async function serveDir(dir, { base = '' } = {}) {
  const root = normalize(dir.endsWith(sep) ? dir : dir + sep);
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (base && p.startsWith(base)) p = p.slice(base.length);
      let file = normalize(join(root, p));
      // path-traversal guard: resolved file must stay under root
      if (!file.startsWith(root.slice(0, -1))) { res.writeHead(403).end(); return; }
      let s = await stat(file).catch(() => null);
      if (s && s.isDirectory()) { file = join(file, 'index.html'); s = await stat(file).catch(() => null); }
      if (!s || !s.isFile()) { res.writeHead(404).end('404'); return; }
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
    } catch { res.writeHead(500).end(); }
  });
  await new Promise((r, j) => { server.once('error', j); server.listen(0, '127.0.0.1', r); });
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}`;
  return {
    port, url, base,
    href: (p = '') => `${url}${base}${p ? '/' + String(p).replace(/^\//, '') : '/'}`,
    close: () => new Promise((r) => server.close(r)),
  };
}

/**
 * Launch ONE hardened Chromium, run fn(browser), and ALWAYS close it.
 * @template T @param {(browser:import('playwright').Browser)=>Promise<T>} fn @returns {Promise<T>}
 */
export async function withBrowser(fn) {
  const browser = await chromium.launch(HARDENED);
  try { return await fn(browser); }
  finally { await browser.close(); }
}

/**
 * Open an isolated context+page, auto-attach console/pageerror/network capture, run fn, ALWAYS close.
 * @param {import('playwright').Browser} browser
 * @param {{ viewport?:{width:number,height:number} }} [opts]
 * @param {(page:import('playwright').Page, capture:{pageerrors:string[],console:string[],requests:string[]})=>Promise<any>} fn
 */
export async function withPage(browser, opts = {}, fn) {
  const { viewport } = opts;
  const ctx = await browser.newContext(viewport ? { viewport } : {});
  const page = await ctx.newPage();
  const capture = { pageerrors: [], console: [], requests: [] };
  page.on('pageerror', (e) => capture.pageerrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') capture.console.push(m.text()); });
  page.on('request', (r) => capture.requests.push(r.url()));
  try { return await fn(page, capture); }
  finally { await page.close().catch(() => {}); await ctx.close().catch(() => {}); }
}

/**
 * Deterministic readiness — wait until `predicate` (evaluated IN the page) returns truthy.
 * Replaces fixed waitForTimeout(ms). One timeout knob instead of scattered magic sleeps.
 * @param {import('playwright').Page} page
 * @param {Function|string} predicate  runs in page context
 * @param {{ timeout?:number, polling?:number|'raf' }} [opts]
 */
export function ready(page, predicate, { timeout = 20000, polling = 'raf' } = {}) {
  return page.waitForFunction(predicate, undefined, { timeout, polling });
}

/** Convenience: launch hardened, serve a dir, run fn({browser,server}), tear both down. */
export async function withServedBrowser(dir, opts, fn) {
  const server = await serveDir(dir, opts);
  try { return await withBrowser((browser) => fn({ browser, server })); }
  finally { await server.close(); }
}
