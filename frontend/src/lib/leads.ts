import api, { API_BASE_URL } from "./api";

export const STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_META: Record<Stage, { label: string; hint: string; color: string }> = {
  new: { label: "New", hint: "Not contacted yet", color: "#60a5fa" },
  contacted: { label: "Contacted", hint: "We replied or called", color: "#a78bfa" },
  qualified: { label: "Qualified", hint: "Budget, timeline and fit confirmed", color: "#fbbf24" },
  proposal: { label: "Proposal", hint: "Quote or package sent", color: "#f97316" },
  won: { label: "Won", hint: "Signed", color: "#72c04f" },
  lost: { label: "Lost", hint: "Closed without a deal", color: "#71717a" },
};

export const CURRENCIES = ["EGP", "USD", "AED", "SAR", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SOURCE_LABELS: Record<string, string> = {
  contact: "Contact form",
  service: "Service page",
  package: "Package",
  product: "Product demo",
  booking: "Google Meet",
  registered: "Client portal",
};

export type Ref = { _id: string; name?: string; title?: string; email?: string };

export type LeadSummary = {
  _id: string;
  title: string;
  description?: string;
  source: string;
  status: string;
  stage: Stage;
  owner?: Ref | null;
  followUpAt?: string | null;
  value?: number | null;
  currency: Currency;
  lostReason?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  company?: string;
  interest?: string;
  package?: Ref | null;
  meeting_date?: string;
  meetLink?: string;
  firstResponseAt?: string;
  project?: string | Ref | null;
  locale?: "en" | "ar";
  channel: string;
  tracked: boolean;
  attribution?: { utmCampaign?: string; landingPage?: string; referrer?: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadActivity = { _id: string; type: string; message: string; byName?: string; at: string };
export type LeadNote = { _id: string; text: string; byName: string; at: string };

export type LeadDetail = LeadSummary & {
  notes: LeadNote[];
  activity: LeadActivity[];
  user?: Ref | null;
};

export type LeadFilters = {
  q?: string;
  stage?: string;
  source?: string;
  owner?: string;
  followUp?: string;
  from?: string;
  to?: string;
  sort?: string;
};

export type LeadPage = { leads: LeadSummary[]; total: number; page: number; pages: number };

function params(filters: LeadFilters, extra: Record<string, string | number> = {}): Record<string, string | number> {
  const out: Record<string, string | number> = { ...extra };
  for (const [k, v] of Object.entries(filters)) if (v) out[k] = v;
  return out;
}

export async function fetchLeads(filters: LeadFilters, page: number, limit: number): Promise<LeadPage> {
  const res = await api.get<LeadPage>("/lead", { params: params(filters, { page, limit }) });
  return res.data;
}

export async function fetchLead(id: string): Promise<{ lead: LeadDetail; related: { _id: string; title: string; stage: Stage; source: string; createdAt: string }[] }> {
  const res = await api.get(`/lead/${id}`);
  return res.data;
}

export type LeadChanges = Partial<{
  stage: Stage;
  ownerId: string | null;
  followUpAt: string | null;
  value: number | null;
  currency: Currency;
  lostReason: string;
}>;

export async function updateLead(id: string, changes: LeadChanges): Promise<void> {
  await api.patch(`/lead/${id}`, changes);
}

export async function bulkUpdate(ids: string[], changes: { stage?: Stage; ownerId?: string | null }): Promise<number> {
  const res = await api.post<{ updated: number }>("/lead/bulk", { ids, ...changes });
  return res.data.updated;
}

export async function addNote(id: string, text: string): Promise<void> {
  await api.post(`/lead/${id}/notes`, { text });
}

export async function emailLead(id: string, subject: string, body: string): Promise<string> {
  const res = await api.post<{ message: string }>(`/lead/${id}/email`, { subject, body });
  return res.data.message;
}

export async function convertLead(
  id: string,
  input: { title: string; projectTypeId: string; managerId: string; deadline: string },
): Promise<{ projectId: string; userCreated: boolean; inviteSent: boolean }> {
  const res = await api.post(`/lead/${id}/convert`, input);
  return res.data;
}

/** Request status shown to clients in their portal (and, for bookings, the Meet invite). */
export async function updateRequestStatus(id: string, status: string): Promise<void> {
  await api.put("/system-request", { serviceRequest: { id, status } });
}

export function exportUrl(filters: LeadFilters): string {
  const qs = new URLSearchParams(Object.entries(params(filters)).map(([k, v]) => [k, String(v)])).toString();
  return `${API_BASE_URL}/lead/export.csv${qs ? `?${qs}` : ""}`;
}

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString("en-US")} ${currency}`;
  }
}

export function isOverdue(lead: Pick<LeadSummary, "followUpAt" | "stage">): boolean {
  return Boolean(lead.followUpAt && new Date(lead.followUpAt).getTime() < Date.now() && lead.stage !== "won" && lead.stage !== "lost");
}

export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}
