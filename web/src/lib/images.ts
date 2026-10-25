/**
 * next/image only optimizes hosts listed in next.config. CMS images normally live on
 * api.xaeons.com; anything else is passed through unoptimized rather than failing.
 */
export function cmsImage(src: string | undefined | null): { src: string; unoptimized: boolean } | null {
  if (!src) return null;
  try {
    const url = new URL(src);
    return { src, unoptimized: url.hostname !== "api.xaeons.com" };
  } catch {
    return src.startsWith("/") ? { src, unoptimized: false } : null;
  }
}
