import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";
import { buildRoutesToPrerender } from "./prerenderRoutes.mjs";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const DEFAULT_PORT = Number(process.env.PRERENDER_PORT || "4173");

async function pickPort() {
  if (process.env.PRERENDER_PORT) return DEFAULT_PORT;
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      server.close(() => {
        if (!addr || typeof addr === "string") return resolve(DEFAULT_PORT);
        resolve(addr.port);
      });
    });
  });
}

async function stopChild(child) {
  if (!child || child.killed) return;
  const waitExit = () =>
    Promise.race([
      once(child, "exit"),
      new Promise((r) => setTimeout(r, 1500)).then(() => null),
    ]);

  // Vite responds best to SIGINT in most environments.
  child.kill("SIGINT");
  const first = await waitExit();
  if (first) return;

  child.kill("SIGTERM");
  const second = await waitExit();
  if (second) return;

  child.kill("SIGKILL");
  await waitExit();
}

function runPreviewServer(port) {
  const viteBin = path.resolve(process.cwd(), "node_modules/vite/bin/vite.js");
  const child = spawn(
    process.execPath,
    [viteBin, "preview", "--strictPort", "--host", "127.0.0.1", "--port", String(port)],
    { stdio: "pipe", env: process.env, windowsHide: true }
  );

  let ready = false;
  let buffered = "";
  let resolvedBaseUrl = null;
  const readyPromise = new Promise((resolve, reject) => {
    const onData = (buf) => {
      const text = String(buf);
      buffered += text;
      if (buffered.length > 20_000) buffered = buffered.slice(-20_000);
      // Vite preview prints "Local:  http://127.0.0.1:4173/"
      const m = text.match(/Local:\s+(http:\/\/[^\s]+\/)/);
      if (!ready && m?.[1]) {
        ready = true;
        resolvedBaseUrl = m[1].replace(/\/$/, "");
        resolve();
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", reject);
    child.on("exit", (code) => {
      if (!ready) {
        const err = new Error(`preview server exited early (code ${code})\n\n${buffered}`);
        reject(err);
      }
    });
  });

  return {
    child,
    readyPromise,
    getBaseUrl: () => resolvedBaseUrl,
  };
}

function distPathForRoute(routePathname) {
  if (routePathname === "/" || routePathname === "") return path.join(DIST_DIR, "index.html");
  const clean = routePathname.replace(/^\//, "").replace(/\/$/, "");
  return path.join(DIST_DIR, clean, "index.html");
}

async function prerenderRoute({ page, baseUrl, routePathname }) {
  const url = `${baseUrl}${routePathname}`;
  await page.goto(url, { waitUntil: "networkidle" });

  // Give Helmet & client rendering a beat to settle.
  await page.waitForTimeout(250);

  const html = await page.content();
  const outFile = distPathForRoute(routePathname);
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, html, "utf8");
  return { url, outFile };
}

async function main() {
  // Vercel build environment often cannot (or should not) run headless Chromium
  // due to large browser downloads and/or missing system deps, causing long builds.
  // Enable explicitly by setting ENABLE_PRERENDER=true.
  if (process.env.VERCEL && process.env.ENABLE_PRERENDER !== "true") {
    // eslint-disable-next-line no-console
    console.log("[prerender] skipping on Vercel (set ENABLE_PRERENDER=true to enable)");
    return;
  }

  const routes = buildRoutesToPrerender();
  if (routes.length === 0) return;

  const port = await pickPort();
  const { child, readyPromise, getBaseUrl } = runPreviewServer(port);
  try {
    await readyPromise;
    const baseUrl = getBaseUrl() || `http://127.0.0.1:${port}`;

    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      // Basic crawler-friendly header.
      await page.setExtraHTTPHeaders({ "User-Agent": "XaeonsPrerenderBot/1.0" });

      for (const routePathname of routes) {
        const { outFile } = await prerenderRoute({ page, baseUrl, routePathname });
        // eslint-disable-next-line no-console
        console.log(`[prerender] ${routePathname} -> ${path.relative(process.cwd(), outFile)}`);
      }
    } finally {
      await browser.close();
    }
  } finally {
    await stopChild(child);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[prerender] failed:", err);
  process.exit(1);
});

