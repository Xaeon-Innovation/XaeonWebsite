import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const alt = "Xaeon Software Solutions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share card for every page in a locale (pages may override with their own). */
export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: "en", namespace: "home.hero" });
  void locale; // Latin-only card: the bundled OG font has no Arabic glyphs.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0a0a0a",
          color: "#f3f5f2",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
          <path d="M 640 600 C 640 330, 900 120, 1180 150" stroke="#72c04f" strokeWidth="4" fill="none" opacity="0.8" />
          <path d="M1180 128 L1186 144 L1202 150 L1186 156 L1180 172 L1174 156 L1158 150 L1174 144 Z" fill="#72c04f" />
        </svg>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#72c04f", fontWeight: 700 }}>XAEON</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 1.02 }}>
          <span>{t("titleA")}</span>
          <span style={{ color: "#72c04f" }}>{t("titleB")}</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#b8c2bb" }}>Software · AI · Products — xaeons.com</div>
      </div>
    ),
    size,
  );
}
