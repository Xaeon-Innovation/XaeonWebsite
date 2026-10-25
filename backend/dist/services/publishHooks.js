"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyContentChanged = notifyContentChanged;
/**
 * After CMS content changes: ask the public site to refresh its cached pages right away
 * (instead of within 5 minutes), and tell search engines about new/changed URLs via IndexNow.
 * Both are best-effort and never block or fail the admin request.
 */
const SITE_ORIGIN = () => (process.env.SITE_ORIGIN || "https://xaeons.com").replace(/\/+$/, "");
function notifyContentChanged(changedPaths = []) {
    void revalidateSite();
    if (changedPaths.length)
        void pingIndexNow(changedPaths);
}
async function revalidateSite() {
    const url = process.env.WEB_REVALIDATE_URL?.trim();
    const secret = process.env.WEB_REVALIDATE_SECRET?.trim();
    if (!url || !secret)
        return;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
            body: JSON.stringify({ tag: "cms" }),
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok)
            console.error(`[revalidate] ${res.status}`);
    }
    catch (err) {
        console.error("[revalidate] failed:", err instanceof Error ? err.message : err);
    }
}
async function pingIndexNow(paths) {
    const key = process.env.INDEXNOW_KEY?.trim();
    if (!key)
        return;
    const origin = SITE_ORIGIN();
    try {
        const res = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "content-type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                host: new URL(origin).host,
                key,
                keyLocation: `${origin}/indexnow-key.txt`,
                urlList: paths.map((p) => `${origin}${p.startsWith("/") ? p : `/${p}`}`),
            }),
            signal: AbortSignal.timeout(8000),
        });
        if (res.status >= 400)
            console.error(`[indexnow] ${res.status}`);
    }
    catch (err) {
        console.error("[indexnow] failed:", err instanceof Error ? err.message : err);
    }
}
