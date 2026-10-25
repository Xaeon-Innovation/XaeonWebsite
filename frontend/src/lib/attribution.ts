/**
 * First-touch marketing attribution (UTM tags, ad click ids, referrer, landing page).
 *
 * Captured on the first page a visitor lands on and sent with every lead form so the admin
 * can see which channel a lead came from. Held in sessionStorage for every visitor; copied
 * to localStorage (kept 90 days, so it survives return visits) only after analytics consent.
 */

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
  firstSeenAt?: string;
};

const STORAGE_KEY = "xaeon_attribution";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

const PARAM_MAP: Record<string, keyof Attribution> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
  gclid: "gclid",
  fbclid: "fbclid",
};

function read(storage: Storage | undefined): Attribution | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (parsed.firstSeenAt && Date.now() - new Date(parsed.firstSeenAt).getTime() > MAX_AGE_MS) {
      storage?.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function write(storage: Storage | undefined, value: Attribution): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage blocked (private mode, quota): attribution is best-effort.
  }
}

function safeSession(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function safeLocal(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function hasCampaign(a: Attribution | null): boolean {
  return Boolean(a && (a.utmSource || a.gclid || a.fbclid));
}

/** Read the current URL; call once on app start. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const fresh: Attribution = {};
  for (const [param, key] of Object.entries(PARAM_MAP)) {
    const value = params.get(param);
    if (value) fresh[key] = value.slice(0, 300);
  }

  let referrer = "";
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    // Only external referrers say anything about acquisition.
    if (ref && ref.hostname !== window.location.hostname) referrer = ref.href.slice(0, 300);
  } catch {
    referrer = "";
  }
  if (referrer) fresh.referrer = referrer;
  fresh.landingPage = (window.location.pathname + window.location.search).slice(0, 300);
  fresh.firstSeenAt = new Date().toISOString();

  const existing = getAttribution();
  // Keep the first touch, unless it was "direct" and this visit carries a real campaign.
  if (existing && !(hasCampaign(fresh) && !hasCampaign(existing))) return;

  write(safeSession(), fresh);
  if (read(safeLocal())) write(safeLocal(), fresh);
}

/** Called when the visitor accepts analytics cookies: keep attribution for return visits. */
export function persistAttribution(): void {
  const current = read(safeSession());
  if (current && !read(safeLocal())) write(safeLocal(), current);
}

/** Called when the visitor declines: drop anything stored long-term. */
export function forgetPersistedAttribution(): void {
  try {
    safeLocal()?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getAttribution(): Attribution | null {
  return read(safeLocal()) ?? read(safeSession());
}

/** Human channel label, e.g. "google / cpc", "Referral: linkedin.com" or "Direct" (mirrors the API). */
export function channelLabel(a: Attribution | null | undefined): string {
  if (!a) return "Direct";
  if (a.utmSource) return a.utmMedium ? `${a.utmSource} / ${a.utmMedium}` : a.utmSource;
  if (a.gclid) return "google / cpc";
  if (a.fbclid) return "facebook / paid-social";
  if (a.referrer) {
    try {
      return `Referral: ${new URL(a.referrer).hostname.replace(/^www\./, "")}`;
    } catch {
      return "Referral";
    }
  }
  return "Direct";
}
