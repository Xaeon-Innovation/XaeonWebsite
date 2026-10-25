"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getAttribution } from "@/lib/attribution";
import { trackLead } from "@/lib/analytics";

type SlotOption = { start: string; label: string };
type Availability = {
  open: boolean;
  reason: "not_connected" | "unavailable" | null;
  timezone: string;
  slotMinutes: number;
  horizonDays: number;
  month: string;
  dates: Record<string, SlotOption[]>;
};
type Meeting = { start: string; whenLabel: string; meetLink: string; timezone: string };

const TZ = "Africa/Cairo";
const PERIODS = [
  { id: "morning", from: "10:00", to: "14:00" },
  { id: "afternoon", from: "14:00", to: "18:00" },
  { id: "evening", from: "18:00", to: "22:00" },
  { id: "night", from: "22:00", to: "02:00" },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const u = new Date(Date.UTC(y, m - 1, d + days));
  return `${u.getUTCFullYear()}-${pad(u.getUTCMonth() + 1)}-${pad(u.getUTCDate())}`;
}
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
function inPeriod(label: string, from: string, to: string): boolean {
  const v = minutes(label);
  const a = minutes(from);
  const b = minutes(to);
  return a < b ? v >= a && v < b : v >= a || v < b;
}
const utcDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookingCalendar({ packageId }: { packageId?: string }) {
  const t = useTranslations("booking");
  const tf = useTranslations("form");
  const locale = useLocale();
  // Latin digits keep times and dates unambiguous in both languages.
  const intlLocale = locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";

  const [month, setMonth] = useState(() => ymd(TZ).slice(0, 7));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [periodId, setPeriodId] = useState<PeriodId | null>(null);
  const [slot, setSlot] = useState<SlotOption | null>(null);
  const [step, setStep] = useState<"schedule" | "details" | "done">("schedule");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const detailsHeading = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetch(`/api/v1/bookings/availability?month=${month}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: Availability) => !cancelled && setAvailability(data))
      .catch(() => {
        if (cancelled) return;
        setAvailability(null);
        setLoadError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month, reloadKey]);

  useEffect(() => {
    if (step === "details") detailsHeading.current?.focus();
  }, [step]);

  const timezone = availability?.timezone || TZ;
  const today = ymd(timezone);
  const firstMonth = today.slice(0, 7);
  const lastMonth = addDays(today, availability?.horizonDays ?? 30).slice(0, 7);
  const dates = availability?.dates ?? {};

  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(intlLocale, { weekday: "short", timeZone: "UTC" });
    // 2024-01-01 was a Monday.
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2024, 0, 1 + i))));
  }, [intlLocale]);

  const cells = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    const items: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= count; d += 1) items.push(`${month}-${pad(d)}`);
    return items;
  }, [month]);

  const monthTitle = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    utcDate(`${month}-01`),
  );
  const longDate = (d: string) =>
    new Intl.DateTimeFormat(intlLocale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(utcDate(d));

  const daySlots = date ? dates[date] ?? [] : [];
  const periods = PERIODS.filter((p) => daySlots.some((s) => inPeriod(s.label, p.from, p.to)));
  const period = PERIODS.find((p) => p.id === periodId) ?? null;
  const periodSlots = period ? daySlots.filter((s) => inPeriod(s.label, period.from, period.to)) : [];
  const closed = availability && !availability.open && availability.reason !== "unavailable";

  const resetSelection = () => {
    setDate(null);
    setPeriodId(null);
    setSlot(null);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!slot) return;
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const found: Record<string, string> = {};
    if (get("name").length < 2) found.name = tf("errors.name");
    if (get("phone").replace(/[^\d]/g, "").length < 7) found.phone = tf("errors.phone");
    if (!EMAIL_RE.test(get("email"))) found.email = tf("errors.email");
    if (get("message").length < 10) found.message = tf("errors.message");
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: get("name"),
          company: get("company") || undefined,
          phone: get("phone"),
          email: get("email"),
          message: get("message"),
          website: get("website"),
          slot: slot.start,
          attribution: getAttribution() ?? undefined,
          ...(packageId ? { packageId } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { meeting?: Meeting; emailWarning?: string; error?: string };
      if (!res.ok || !body.meeting) {
        const taken = (body.error ?? "").toLowerCase().includes("no longer available");
        setSubmitError(taken ? t("slotTaken") : t("errorGeneric"));
        if (taken) {
          resetSelection();
          setStep("schedule");
          setReloadKey((k) => k + 1);
        }
        return;
      }
      setMeeting(body.meeting);
      setEmailWarning(body.emailWarning ?? null);
      trackLead("booking", { package_id: packageId });
      setStep("done");
    } catch {
      setSubmitError(t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  const chip = (active: boolean) =>
    `min-h-11 rounded-xl border px-4 text-sm font-medium tabular-nums transition-colors ${
      active ? "border-sage bg-sage text-on-sage" : "border-line-strong text-fog hover:border-sage"
    }`;
  const input =
    "w-full rounded-xl border border-line-strong bg-ink-2 px-4 py-3 text-fog placeholder:text-haze focus:border-sage focus:outline-none aria-[invalid=true]:border-danger";
  const stepLabel = "text-sm font-semibold text-sage";

  if (step === "done" && meeting) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border border-sage/30 bg-sage/10 p-6">
        <CheckCircle2 size={28} aria-hidden className="text-sage" />
        <p className={stepLabel}>{t("doneEyebrow")}</p>
        <p className="font-display text-2xl font-semibold">{t("doneTitle")}</p>
        <p className="text-fog">{meeting.whenLabel}</p>
        <p className="text-mist">{emailWarning ?? t("doneBody")}</p>
        <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center rounded-full bg-sage px-5 font-semibold text-on-sage">
          {t("join")}
        </a>
      </div>
    );
  }

  if (closed) {
    return <p className="rounded-2xl border border-line p-6 text-mist">{t("closed")}</p>;
  }

  if (step === "details" && slot && date) {
    const fieldProps = (name: string) => ({
      id: `book-${name}`,
      name,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? `book-${name}-err` : undefined,
    });
    const err = (name: string) =>
      errors[name] ? <p id={`book-${name}-err`} className="text-sm text-danger">{errors[name]}</p> : null;
    return (
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -start-[10000px] h-px w-px opacity-0" />
        <div>
          <p ref={detailsHeading} tabIndex={-1} className={`${stepLabel} focus:outline-none`}>{t("step4")}</p>
          <p className="mt-1 text-fog">{t("summary", { date: longDate(date), time: slot.label })}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="book-name" className="text-sm font-medium">{tf("name")}</label>
            <input {...fieldProps("name")} autoComplete="name" className={input} />
            {err("name")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="book-company" className="text-sm font-medium">
              {tf("company")} <span className="font-normal text-haze">({tf("optional")})</span>
            </label>
            <input id="book-company" name="company" autoComplete="organization" className={input} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="book-phone" className="text-sm font-medium">{tf("phone")}</label>
            <input {...fieldProps("phone")} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className={`${input} rtl:text-right`} />
            {err("phone")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="book-email" className="text-sm font-medium">{tf("email")}</label>
            <input {...fieldProps("email")} type="email" inputMode="email" autoComplete="email" dir="ltr" className={`${input} rtl:text-right`} />
            {err("email")}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="book-message" className="text-sm font-medium">{tf("message")}</label>
          <textarea {...fieldProps("message")} rows={4} placeholder={tf("messagePlaceholder")} className={input} />
          {err("message")}
        </div>
        {submitError ? <p role="alert" className="text-sm text-danger">{submitError}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setStep("schedule")} className="min-h-12 rounded-full border border-line-strong px-5 font-semibold text-fog hover:border-mist">
            {t("back")}
          </button>
          <button type="submit" disabled={submitting} className="min-h-12 rounded-full bg-sage px-6 font-semibold text-on-sage hover:bg-sage-strong disabled:opacity-60">
            {submitting ? t("confirming") : t("confirm")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={stepLabel}>{t("step1")}</p>
        <p className="mt-1 text-sm text-mist">{t("step1Help")}</p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label={t("prevMonth")}
          disabled={month <= firstMonth}
          onClick={() => {
            resetSelection();
            setMonth((m) => shiftMonth(m, -1));
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-fog hover:border-sage disabled:opacity-30"
        >
          <ChevronLeft size={18} aria-hidden className="rtl:rotate-180" />
        </button>
        <h3 className="font-sans text-lg font-semibold" aria-live="polite">{monthTitle}</h3>
        <button
          type="button"
          aria-label={t("nextMonth")}
          disabled={month >= lastMonth}
          onClick={() => {
            resetSelection();
            setMonth((m) => shiftMonth(m, 1));
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-fog hover:border-sage disabled:opacity-30"
        >
          <ChevronRight size={18} aria-hidden className="rtl:rotate-180" />
        </button>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-xs text-haze" aria-hidden>
          {weekdays.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) => {
            if (!cell) return <span key={`b${i}`} />;
            const open = Boolean(dates[cell]?.length);
            const selected = date === cell;
            return (
              <button
                key={cell}
                type="button"
                disabled={!open}
                aria-pressed={selected}
                aria-label={`${longDate(cell)}, ${open ? t("available") : t("unavailable")}`}
                onClick={() => {
                  setDate(cell);
                  setPeriodId(null);
                  setSlot(null);
                }}
                className={`h-11 rounded-xl text-sm font-medium tabular-nums transition-colors sm:h-12 ${
                  selected
                    ? "bg-sage text-on-sage"
                    : open
                      ? "bg-sage/15 text-fog ring-1 ring-sage/40 hover:bg-sage/25"
                      : "text-haze/50"
                }`}
              >
                {Number(cell.slice(8))}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-live="polite" className="text-sm text-mist">
        {loading ? t("loading") : loadError || availability?.reason === "unavailable" ? (
          <span className="text-danger">{t("loadError")}</span>
        ) : availability?.open && Object.keys(dates).length === 0 ? (
          t("noTimesMonth")
        ) : null}
      </div>

      {date ? (
        <div className="flex flex-col gap-3">
          <p className={stepLabel}>{t("step2")}</p>
          <p className="text-fog">{longDate(date)}</p>
          {periods.length === 0 ? (
            <p className="text-sm text-mist">{t("noTimesDay")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {periods.map((p) => (
                <button key={p.id} type="button" aria-pressed={periodId === p.id} className={chip(periodId === p.id)} onClick={() => { setPeriodId(p.id); setSlot(null); }}>
                  {t(`periods.${p.id}`)} <span dir="ltr" className="opacity-70">· {p.from}–{p.to}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {period && periodSlots.length ? (
        <div className="flex flex-col gap-3">
          <p className={stepLabel}>{t("step3")}</p>
          <div className="flex flex-wrap gap-2">
            {periodSlots.map((s) => (
              <button key={s.start} type="button" dir="ltr" aria-pressed={slot?.start === s.start} className={chip(slot?.start === s.start)} onClick={() => setSlot(s)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {submitError ? <p role="alert" className="text-sm text-danger">{submitError}</p> : null}

      <button
        type="button"
        disabled={!slot}
        onClick={() => setStep("details")}
        className="min-h-12 self-start rounded-full bg-sage px-6 font-semibold text-on-sage hover:bg-sage-strong disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("continue")}
      </button>
    </div>
  );
}
