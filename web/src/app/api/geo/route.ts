import { NextResponse, type NextRequest } from "next/server";

/**
 * Visitor's country (ISO 3166-1 alpha-2) from Vercel's edge geolocation header, used by the Website Builder
 * to pre-select the business country. Null outside Vercel or when unknown. Not stored anywhere.
 */
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const raw = req.headers.get("x-vercel-ip-country")?.toUpperCase() ?? "";
  const country = /^[A-Z]{2}$/.test(raw) ? raw : null;
  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, no-store" } });
}
