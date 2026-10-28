import type { Star } from "./builder";

/**
 * Deterministic layout for the galaxy of stars (see docs/website-builder/galaxy.md).
 * Clients are grouped into constellations (by `constellation`, else `product`); each group gets a
 * centre on a wide ellipse, and its stars are scattered around it with a seeded hash of their id,
 * so the sky looks the same on every render, on server and client.
 */

export const SKY_W = 1000;
export const SKY_H = 560;
/** Reserved spot for the pulsing "join our galaxy" star. */
export const JOIN_POINT = { x: 900, y: 470 };

export type PlacedStar = Star & { x: number; y: number; r: number; group: string };
/** `labelX/labelY`: where the constellation name sits, just above its highest star. */
export type Constellation = { key: string; x: number; y: number; labelX: number; labelY: number; stars: PlacedStar[]; path: string };

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909);
    s ^= s >>> 16;
    return (s >>> 0) / 4294967296;
  };
}

export const groupOf = (s: Star) => s.constellation?.trim() || s.product;

export function layoutGalaxy(stars: Star[]): Constellation[] {
  const groups = new Map<string, Star[]>();
  for (const s of stars) groups.set(groupOf(s), [...(groups.get(groupOf(s)) ?? []), s]);
  const keys = [...groups.keys()];
  const n = keys.length;

  return keys.map((key, gi) => {
    // Group centres around an ellipse, starting top-left; a single group sits in the middle.
    const angle = n === 1 ? 0 : Math.PI * 1.15 + (gi / n) * Math.PI * 2;
    const cx = n === 1 ? SKY_W / 2 : SKY_W / 2 + Math.cos(angle) * SKY_W * 0.3;
    const cy = n === 1 ? SKY_H / 2 : SKY_H / 2 + Math.sin(angle) * SKY_H * 0.28;
    const members = groups.get(key)!;
    const spread = Math.min(150, 50 + members.length * 14);
    const placed: PlacedStar[] = [];

    for (const s of members) {
      const rand = rng(hash(s._id || s.name));
      let best = { x: cx, y: cy, d: -1 };
      // Best of a few candidates: keeps stars from overlapping without a physics pass.
      for (let tries = 0; tries < 8; tries += 1) {
        const a = rand() * Math.PI * 2;
        const dist = (0.35 + rand() * 0.65) * spread;
        const x = Math.min(SKY_W - 40, Math.max(40, cx + Math.cos(a) * dist * 1.4));
        const y = Math.min(SKY_H - 40, Math.max(40, cy + Math.sin(a) * dist));
        const nearest = Math.min(Infinity, ...placed.map((p) => Math.hypot(p.x - x, p.y - y)), Math.hypot(JOIN_POINT.x - x, JOIN_POINT.y - y));
        if (nearest > best.d) best = { x, y, d: nearest };
        if (nearest > 70) break;
      }
      placed.push({ ...s, x: Math.round(best.x), y: Math.round(best.y), r: 3 + Math.max(1, Math.min(3, s.magnitude)) * 2, group: key });
    }

    // Constellation line: visit stars by angle around the centre.
    const ordered = [...placed].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    const path = ordered.length > 1 ? `M${ordered.map((p) => `${p.x} ${p.y}`).join(" L")}` : "";
    const labelX = Math.round(placed.reduce((sum, p) => sum + p.x, 0) / placed.length);
    const labelY = Math.max(24, Math.min(...placed.map((p) => p.y)) - 34);
    return { key, x: Math.round(cx), y: Math.round(cy), labelX, labelY, stars: placed, path };
  });
}
