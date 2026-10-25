import sharp from "sharp";

const MAX_BYTES = 10 * 1024 * 1024;

export type RasterKind = "team" | "case" | "logo" | "blog";

export function assertRasterSize(buffer: Buffer): void {
  if (buffer.length > MAX_BYTES) {
    throw new Error("File too large (max 10MB)");
  }
}

/** Raster images → WebP on disk. Dimensions tuned for storage vs quality. */
export async function rasterToWebp(buffer: Buffer, kind: RasterKind): Promise<Buffer> {
  assertRasterSize(buffer);
  let img = sharp(buffer).rotate();

  const maxEdge =
    kind === "case" ? 2560 : kind === "blog" ? 1600 : kind === "team" ? 1200 : 512;
  const quality = kind === "case" ? 78 : kind === "blog" ? 80 : kind === "team" ? 80 : 85;

  img = img.resize({
    width: maxEdge,
    height: maxEdge,
    fit: "inside",
    withoutEnlargement: true,
  });

  return img.webp({ quality, effort: 4 }).toBuffer();
}

export const MAX_SVG_BYTES = 200 * 1024;
