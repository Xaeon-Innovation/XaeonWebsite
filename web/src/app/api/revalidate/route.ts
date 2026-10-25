import { timingSafeEqual } from "crypto";
import { revalidateTag } from "next/cache";

/**
 * Called by the API after CMS content changes so pages refresh on the next visit instead of
 * within 5 minutes. Protected by a shared secret (REVALIDATE_SECRET).
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? "";
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok =
    secret.length >= 16 &&
    given.length === secret.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Editors expect a published change to show on the very next visit, so serve no stale copy.
  revalidateTag("cms", { expire: 0 });
  return Response.json({ revalidated: true });
}
