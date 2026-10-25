import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRightLeft, CircleDot, FolderKanban, Mail, MessageCircle, Phone, StickyNote, UserRound, X, type LucideIcon } from "lucide-react";
import { getApiErrorMessage } from "../../../lib/api";
import {
  addNote,
  convertLead,
  CURRENCIES,
  emailLead,
  fetchLead,
  formatMoney,
  SOURCE_LABELS,
  STAGE_META,
  STAGES,
  updateLead,
  updateRequestStatus,
  type Currency,
  type LeadChanges,
  type LeadDetail,
  type Stage,
} from "../../../lib/leads";
import styles from "./Leads.module.css";

type Option = { _id: string; name?: string; title?: string };
type Props = {
  leadId: string;
  employees: Option[];
  projectTypes: Option[];
  onClose: () => void;
  /** Called after any change so the board/table can refresh. */
  onChanged: () => void;
};

type Tab = "activity" | "email" | "convert";

const ICONS: Record<string, LucideIcon> = {
  note: StickyNote,
  email: Mail,
  owner: UserRound,
  converted: FolderKanban,
  stage: ArrowRightLeft,
};

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inDays(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function hoursBetween(a: string, b: string): string {
  const h = (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} days`;
}

function templates(lead: LeadDetail): { label: string; subject: string; body: string }[] {
  const first = (lead.contactName || "").trim().split(/\s+/)[0] || "";
  const topic = lead.interest || lead.package?.title || "your project";
  if (lead.locale === "ar") {
    return [
      { label: "شكرًا — لنتحدث", subject: "الخطوات التالية مع Xaeon", body: `مرحبًا ${first}،\n\nشكرًا لتواصلك معنا بخصوص ${topic}. يسعدنا أن نتعرف أكثر على ما تحتاجه.\n\nهل يناسبك اجتماع قصير هذا الأسبوع؟ يمكنك اختيار الموعد المناسب من هنا: https://xaeons.com/ar/book\n\nمع التحية،\nفريق Xaeon` },
      { label: "متابعة العرض", subject: `متابعة: عرض ${topic}`, body: `مرحبًا ${first}،\n\nأردنا الاطمئنان إن كانت لديك أي أسئلة حول العرض الذي أرسلناه. يسعدنا تعديله ليناسب ميزانيتك وجدولك الزمني.\n\nمع التحية،\nفريق Xaeon` },
      { label: "اطمئنان", subject: "هل ما زلت مهتمًا؟", body: `مرحبًا ${first}،\n\nلم نسمع منك منذ فترة، وأردنا الاطمئنان إن كان ${topic} ما زال ضمن خططك. إن كان التوقيت غير مناسب الآن، أخبرنا ومتى نعاود التواصل.\n\nمع التحية،\nفريق Xaeon` },
    ];
  }
  return [
    { label: "Thanks — let's talk", subject: "Next steps with Xaeon", body: `Hi ${first},\n\nThanks for getting in touch about ${topic}. We'd love to learn more about what you need.\n\nWould a short call this week work? You can pick a time here: https://xaeons.com/book\n\nBest,\nThe Xaeon team` },
    { label: "Proposal follow-up", subject: `Following up on your ${topic} proposal`, body: `Hi ${first},\n\nI wanted to check whether you had any questions about the proposal we sent. We're happy to adjust it to fit your budget and timeline.\n\nBest,\nThe Xaeon team` },
    { label: "Checking in", subject: "Still interested?", body: `Hi ${first},\n\nWe haven't heard from you in a while and wanted to check whether ${topic} is still on your plans. If the timing isn't right, just let us know when to follow up.\n\nBest,\nThe Xaeon team` },
  ];
}

export default function LeadDrawer({ leadId, employees, projectTypes, onClose, onChanged }: Props) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [related, setRelated] = useState<{ _id: string; title: string; stage: Stage; createdAt: string }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [tab, setTab] = useState<Tab>("activity");
  const [note, setNote] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [conv, setConv] = useState({ title: "", projectTypeId: "", managerId: "", deadline: "" });
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchLead(leadId);
      setLead(data.lead);
      setRelated(data.related);
      setLoadError(null);
    } catch (e) {
      setLoadError(getApiErrorMessage(e, "Couldn't load this lead."));
    }
  }, [leadId]);

  useEffect(() => {
    setLead(null);
    setNotice(null);
    setTab("activity");
    void load();
  }, [load]);

  useEffect(() => {
    returnFocus.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      (returnFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    if (lead) setConv((c) => ({ ...c, title: c.title || lead.interest || lead.title, managerId: c.managerId || lead.owner?._id || "" }));
  }, [lead]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice({ text: success });
      await load();
      onChanged();
      return true;
    } catch (e) {
      setNotice({ text: getApiErrorMessage(e, "That didn't work. Please try again."), error: true });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = (changes: LeadChanges, success = "Saved") => run(() => updateLead(leadId, changes), success);

  const name = lead?.contactName || lead?.title || "Lead";
  const phoneDigits = (lead?.contactPhone ?? "").replace(/[^\d]/g, "");
  const timeline = lead
    ? [
        ...lead.activity.filter((a) => a.type !== "note").map((a) => ({ id: a._id, type: a.type, text: a.message, by: a.byName, at: a.at })),
        ...lead.notes.map((n) => ({ id: n._id, type: "note", text: n.text, by: n.byName, at: n.at })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    : [];

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="lead-drawer-title">
        <header className={styles.drawerHead}>
          <div style={{ minWidth: 0 }}>
            <h2 id="lead-drawer-title" className={styles.drawerTitle}>{name}</h2>
            {lead ? (
              <p className={styles.rowSub} style={{ margin: "4px 0 0" }}>
                {[lead.company, SOURCE_LABELS[lead.source] ?? lead.source, new Date(lead.createdAt).toLocaleString()].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <button ref={closeRef} type="button" className="admin-btn admin-btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose} aria-label="Close lead">
            <X size={18} />
          </button>
        </header>

        <div className={styles.drawerBody}>
          {loadError ? <p className={`${styles.notice} ${styles.noticeError}`}>{loadError}</p> : null}
          {!lead && !loadError ? <p className={styles.rowSub}>Loading…</p> : null}
          {notice ? <p role="status" className={`${styles.notice} ${notice.error ? styles.noticeError : ""}`}>{notice.text}</p> : null}

          {lead ? (
            <>
              <section className={styles.section} aria-label="Pipeline">
                <div className={styles.grid2}>
                  <label className="admin-field">
                    <span className="admin-label">Stage</span>
                    <select className="admin-select" value={lead.stage} disabled={busy} onChange={(e) => void save({ stage: e.target.value as Stage }, "Stage updated")}>
                      {STAGES.map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                    </select>
                  </label>
                  <label className="admin-field">
                    <span className="admin-label">Owner</span>
                    <select className="admin-select" value={lead.owner?._id ?? ""} disabled={busy} onChange={(e) => void save({ ownerId: e.target.value || null }, "Owner updated")}>
                      <option value="">Unassigned</option>
                      {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                  </label>
                  <label className="admin-field">
                    <span className="admin-label">Follow-up</span>
                    <input
                      type="datetime-local"
                      className="admin-input"
                      value={toLocalInput(lead.followUpAt)}
                      disabled={busy}
                      onChange={(e) => void save({ followUpAt: e.target.value ? new Date(e.target.value).toISOString() : null }, "Follow-up updated")}
                    />
                  </label>
                  <div className="admin-field">
                    <span className="admin-label">Deal value</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        key={`${lead._id}-${lead.value ?? ""}`}
                        type="number"
                        min={0}
                        step={100}
                        inputMode="numeric"
                        className="admin-input"
                        style={{ flex: 1, minWidth: 0 }}
                        aria-label="Deal value"
                        defaultValue={lead.value ?? ""}
                        disabled={busy}
                        onBlur={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          if (v !== (lead.value ?? null)) void save({ value: v }, "Value updated");
                        }}
                      />
                      <select className="admin-select" aria-label="Currency" style={{ width: 84, flexShrink: 0 }} value={lead.currency} disabled={busy} onChange={(e) => void save({ currency: e.target.value as Currency }, "Currency updated")}>
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className={styles.templates} aria-label="Quick follow-up">
                  {[
                    ["Tomorrow", 1],
                    ["In 3 days", 3],
                    ["Next week", 7],
                  ].map(([label, days]) => (
                    <button key={label} type="button" className={styles.chip} disabled={busy} onClick={() => void save({ followUpAt: inDays(days as number) }, `Follow-up set for ${String(label).toLowerCase()}`)}>
                      Follow up {String(label).toLowerCase()}
                    </button>
                  ))}
                  {lead.followUpAt ? (
                    <button type="button" className={styles.chip} disabled={busy} onClick={() => void save({ followUpAt: null }, "Follow-up cleared")}>
                      Clear follow-up
                    </button>
                  ) : null}
                </div>
                {lead.stage === "lost" ? (
                  <label className="admin-field">
                    <span className="admin-label">Lost reason</span>
                    <input
                      key={`${lead._id}-${lead.lostReason ?? ""}`}
                      className="admin-input"
                      placeholder="e.g. Budget, timing, chose another vendor"
                      defaultValue={lead.lostReason ?? ""}
                      onBlur={(e) => e.target.value.trim() !== (lead.lostReason ?? "") && void save({ lostReason: e.target.value }, "Reason saved")}
                    />
                  </label>
                ) : null}
              </section>

              <section className={styles.section} aria-labelledby="contact-title">
                <h3 id="contact-title" className={styles.sectionTitle}>Contact</h3>
                <div className={styles.templates}>
                  {lead.contactEmail ? (
                    <button type="button" className="admin-btn admin-btn-primary" style={{ padding: "6px 10px" }} onClick={() => setTab("email")}>
                      <Mail size={14} /> Email
                    </button>
                  ) : null}
                  {phoneDigits ? (
                    <>
                      <a className="admin-btn admin-btn-ghost" style={{ padding: "6px 10px" }} href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                      <a className="admin-btn admin-btn-ghost" style={{ padding: "6px 10px" }} href={`tel:${lead.contactPhone}`}>
                        <Phone size={14} /> Call
                      </a>
                    </>
                  ) : null}
                </div>
                <dl className={styles.kv}>
                  {lead.contactEmail ? (<><dt>Email</dt><dd><a href={`mailto:${lead.contactEmail}`}>{lead.contactEmail}</a></dd></>) : null}
                  {lead.contactPhone ? (<><dt>Phone</dt><dd dir="ltr">{lead.contactPhone}</dd></>) : null}
                  {lead.company ? (<><dt>Company</dt><dd>{lead.company}</dd></>) : null}
                  <dt>Source</dt><dd>{SOURCE_LABELS[lead.source] ?? lead.source}{lead.interest ? ` · ${lead.interest}` : ""}</dd>
                  <dt>Channel</dt><dd>{lead.tracked ? lead.channel : "Not tracked"}</dd>
                  {lead.attribution?.utmCampaign ? (<><dt>Campaign</dt><dd>{lead.attribution.utmCampaign}</dd></>) : null}
                  {lead.attribution?.landingPage ? (<><dt>Landed on</dt><dd>{lead.attribution.landingPage}</dd></>) : null}
                  {lead.package?.title ? (<><dt>Package</dt><dd>{lead.package.title}</dd></>) : null}
                  {lead.meeting_date ? (
                    <>
                      <dt>Meeting</dt>
                      <dd>
                        {new Date(lead.meeting_date).toLocaleString()}
                        {lead.meetLink ? <> · <a href={lead.meetLink} target="_blank" rel="noreferrer">Meet link</a></> : null}
                      </dd>
                    </>
                  ) : null}
                  <dt>Language</dt><dd>{lead.locale === "ar" ? "Arabic" : "English"}</dd>
                  <dt>First reply</dt><dd>{lead.firstResponseAt ? `after ${hoursBetween(lead.createdAt, lead.firstResponseAt)}` : "Not yet"}</dd>
                  <dt>Client sees</dt>
                  <dd>
                    <select
                      className="admin-select"
                      aria-label="Request status shown to the client"
                      value={lead.status}
                      disabled={busy}
                      onChange={(e) => void run(() => updateRequestStatus(lead._id, e.target.value), "Request status updated")}
                    >
                      {["Pending Review", "Accepted", "Rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {lead.source === "booking" ? <span className={styles.rowSub} style={{ display: "block", marginTop: 4 }}>Rejecting a booking cancels its Google Meet.</span> : null}
                  </dd>
                </dl>
                {lead.description ? <p className={styles.message}>{lead.description}</p> : null}
                {related.length ? (
                  <div>
                    <h4 className={styles.sectionTitle} style={{ marginBottom: 6 }}>Earlier leads from this person</h4>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.8125rem" }}>
                      {related.map((r) => (
                        <li key={r._id}>
                          {r.title} · {STAGE_META[r.stage]?.label ?? r.stage} · {new Date(r.createdAt).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>

              <div className={styles.tabs} role="tablist" aria-label="Lead actions">
                {(["activity", "email", "convert"] as Tab[]).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                    {t === "activity" ? `History (${timeline.length})` : t === "email" ? "Email" : lead.project ? "Project" : "Convert to project"}
                  </button>
                ))}
              </div>

              {tab === "activity" ? (
                <section className={styles.section} aria-label="History">
                  <form
                    className={styles.section}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!note.trim()) return;
                      if (await run(() => addNote(leadId, note.trim()), "Note added")) setNote("");
                    }}
                  >
                    <label className="admin-field">
                      <span className="admin-label">Add an internal note</span>
                      <textarea className="admin-textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Call notes, budget, decision makers… (never sent to the client)" />
                    </label>
                    <button type="submit" className="admin-btn admin-btn-primary" style={{ alignSelf: "flex-start" }} disabled={busy || !note.trim()}>
                      Add note
                    </button>
                  </form>
                  <ol className={styles.timeline}>
                    {timeline.map((item) => {
                      const Icon = ICONS[item.type] ?? CircleDot;
                      return (
                        <li key={item.id} className={styles.timelineItem}>
                          <span className={`${styles.timelineIcon} ${item.type === "note" ? styles.timelineIconNote : item.type === "email" ? styles.timelineIconEmail : ""}`} aria-hidden>
                            <Icon size={12} />
                          </span>
                          <span>
                            <span className={styles.timelineText}>{item.text}</span>
                            <span className={styles.timelineMeta} style={{ display: "block" }}>
                              {[item.by, new Date(item.at).toLocaleString()].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ) : null}

              {tab === "email" ? (
                lead.contactEmail ? (
                  <form
                    className={styles.section}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (await run(() => emailLead(leadId, subject.trim(), body.trim()), `Email sent to ${lead.contactEmail}`)) {
                        setSubject("");
                        setBody("");
                        setTab("activity");
                      }
                    }}
                  >
                    <div className={styles.templates}>
                      {templates(lead).map((t) => (
                        <button key={t.label} type="button" className={styles.chip} onClick={() => { setSubject(t.subject); setBody(t.body); }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <p className={styles.rowSub} style={{ margin: 0 }}>
                      To {lead.contactEmail}. Replies go to your team inbox. Sending moves a new lead to Contacted.
                    </p>
                    <label className="admin-field">
                      <span className="admin-label">Subject</span>
                      <input className="admin-input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required />
                    </label>
                    <label className="admin-field">
                      <span className="admin-label">Message</span>
                      <textarea className="admin-textarea" rows={9} value={body} onChange={(e) => setBody(e.target.value)} dir={lead.locale === "ar" ? "rtl" : "ltr"} required />
                    </label>
                    <button type="submit" className="admin-btn admin-btn-primary" style={{ alignSelf: "flex-start" }} disabled={busy || !subject.trim() || body.trim().length < 2}>
                      {busy ? "Sending…" : "Send email"}
                    </button>
                  </form>
                ) : (
                  <p className={styles.rowSub}>This lead has no email address.</p>
                )
              ) : null}

              {tab === "convert" ? (
                lead.project ? (
                  <p className={styles.notice}>
                    Converted to project “{typeof lead.project === "object" ? lead.project.title : "Project"}”. Manage it under Projects.
                  </p>
                ) : (
                  <form
                    className={styles.section}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      let result: Awaited<ReturnType<typeof convertLead>> | null = null;
                      const ok = await run(async () => {
                        result = await convertLead(leadId, { ...conv, deadline: new Date(conv.deadline).toISOString() });
                      }, "Project created");
                      if (ok && result) {
                        const r = result as Awaited<ReturnType<typeof convertLead>>;
                        setNotice({
                          text: r.userCreated
                            ? r.inviteSent
                              ? "Project created. We created a client account and emailed them a link to set their password."
                              : "Project created and a client account was made, but the invite email failed. Use “Resend invite” on the Users page."
                            : "Project created and linked to the client's existing account.",
                        });
                      }
                    }}
                  >
                    <p className={styles.rowSub} style={{ margin: 0 }}>
                      Creates a project the client can follow in their portal. If they don't have an account yet, we create one and email them an invite.
                    </p>
                    <label className="admin-field">
                      <span className="admin-label">Project title</span>
                      <input className="admin-input" value={conv.title} onChange={(e) => setConv({ ...conv, title: e.target.value })} required />
                    </label>
                    <div className={styles.grid2}>
                      <label className="admin-field">
                        <span className="admin-label">Project type</span>
                        <select className="admin-select" value={conv.projectTypeId} onChange={(e) => setConv({ ...conv, projectTypeId: e.target.value })} required>
                          <option value="">Choose…</option>
                          {projectTypes.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                        </select>
                      </label>
                      <label className="admin-field">
                        <span className="admin-label">Project manager</span>
                        <select className="admin-select" value={conv.managerId} onChange={(e) => setConv({ ...conv, managerId: e.target.value })} required>
                          <option value="">Choose…</option>
                          {employees.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                      </label>
                    </div>
                    <label className="admin-field">
                      <span className="admin-label">Deadline</span>
                      <input type="date" className="admin-input" value={conv.deadline} onChange={(e) => setConv({ ...conv, deadline: e.target.value })} required />
                    </label>
                    {lead.value ? <p className={styles.rowSub} style={{ margin: 0 }}>Deal value: {formatMoney(lead.value, lead.currency)}</p> : null}
                    <button type="submit" className="admin-btn admin-btn-primary" style={{ alignSelf: "flex-start" }} disabled={busy}>
                      {busy ? "Creating…" : "Create project and mark won"}
                    </button>
                  </form>
                )
              ) : null}
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}
