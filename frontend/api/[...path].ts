/**
 * Vercel Edge proxy: forwards same-origin /api/* to the Node backend.
 * Set XAEON_API_ORIGIN in the Vercel project (e.g. https://api.xaeons.com — no trailing slash).
 * The SPA rewrite in vercel.json must not send /api to index.html (see vercel.json).
 */
export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  const base = process.env.XAEON_API_ORIGIN?.replace(/\/$/, "");
  if (!base) {
    return new Response(
      JSON.stringify({
        error:
          "API proxy is not configured. In Vercel → Settings → Environment Variables, set XAEON_API_ORIGIN to your HTTPS backend base URL (same paths as /api, e.g. https://api.example.com).",
      }),
      { status: 501, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }

  const incoming = new URL(request.url);
  const target = `${base}${incoming.pathname}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "host") return;
    if (
      ["connection", "keep-alive", "transfer-encoding", "te", "trailer", "upgrade"].includes(
        k
      )
    ) {
      return;
    }
    headers.set(key, value);
  });

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: "manual",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: "Upstream API unreachable", details: msg }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
