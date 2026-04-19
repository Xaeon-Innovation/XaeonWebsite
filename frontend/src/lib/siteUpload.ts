import api from "./api";

export type SiteUploadKind = "team" | "case" | "logo";

/** Uploads raster (→ WebP) or SVG logo to the API; returns public URL. */
export async function uploadSiteAsset(file: File, kind: SiteUploadKind): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  const res = await api.post<{ url: string }>("/admin/site-asset", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const url = res.data?.url;
  if (!url || typeof url !== "string") throw new Error("Upload did not return a URL");
  return url;
}
