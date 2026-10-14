import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api, { getApiErrorMessage } from "../../lib/api";
import formStyles from "./BookNowContact.module.css";
import styles from "./BookingCalendar.module.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  company: z.string().trim().max(120, "Company name is too long.").optional(),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
  email: z.string().trim().email("Please enter a valid email address."),
  message: z.string().trim().min(10, "Please add a short message."),
});

type FormValues = z.infer<typeof schema>;

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

type Meeting = {
  start: string;
  whenLabel: string;
  meetLink: string;
  timezone: string;
};

type Props = {
  packageId?: string | null;
  packageTitle?: string | null;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function monthKey(year: number, monthIndex: number): string {
  return `${year}-${pad(monthIndex + 1)}`;
}

function parseMonth(month: string): { year: number; monthIndex: number } {
  const [year, m] = month.split("-").map(Number);
  return { year, monthIndex: m - 1 };
}

function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex } = parseMonth(month);
  const date = new Date(Date.UTC(year, monthIndex + delta, 1));
  return monthKey(date.getUTCFullYear(), date.getUTCMonth());
}

function currentMonth(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  return parts.slice(0, 7);
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function todayKey(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function weekdayMondayIndex(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const sunday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (sunday + 6) % 7;
}

function monthTitle(month: string): string {
  const { year, monthIndex } = parseMonth(month);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

function dayNumber(date: string): number {
  return Number(date.slice(8, 10));
}

const PERIODS = [
  { id: "morning", label: "10:00 – 14:00", from: "10:00", to: "14:00" },
  { id: "afternoon", label: "14:00 – 18:00", from: "14:00", to: "18:00" },
  { id: "evening", label: "18:00 – 22:00", from: "18:00", to: "22:00" },
  { id: "night", label: "22:00 – 02:00", from: "22:00", to: "02:00" },
] as const;

function labelMinutes(label: string): number {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}

function slotInPeriod(label: string, from: string, to: string): boolean {
  const value = labelMinutes(label);
  const start = labelMinutes(from);
  const end = labelMinutes(to);
  if (start < end) return value >= start && value < end;
  return value >= start || value < end;
}

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export default function BookingCalendar({ packageId, packageTitle }: Props) {
  const [month, setMonth] = useState(() => currentMonth("Africa/Cairo"));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<(typeof PERIODS)[number]["id"] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [step, setStep] = useState<"schedule" | "details" | "done">("schedule");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { name: "", company: "", phone: "", email: "", message: "" },
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    api
      .get<Availability>("/bookings/availability", { params: { month } })
      .then((res) => {
        if (cancelled) return;
        setAvailability(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailability(null);
        setLoadError(getApiErrorMessage(err, "We couldn’t load open times."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const timezone = availability?.timezone || "Africa/Cairo";
  const horizonDays = availability?.horizonDays ?? 30;
  const today = todayKey(timezone);
  const lastMonth = addDays(today, horizonDays).slice(0, 7);
  const dates = availability?.dates ?? {};

  const cells = useMemo(() => {
    const { year, monthIndex } = parseMonth(month);
    const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const leading = weekdayMondayIndex(`${month}-01`);
    const items: Array<{ date: string } | null> = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= count; day += 1) {
      items.push({ date: `${month}-${pad(day)}` });
    }
    return items;
  }, [month]);

  const selectedSlots = selectedDate ? dates[selectedDate] ?? [] : [];
  const openPeriods = PERIODS.filter((period) =>
    selectedSlots.some((slot) => slotInPeriod(slot.label, period.from, period.to)),
  );
  const period = PERIODS.find((item) => item.id === selectedPeriod) ?? null;
  const periodSlots = period
    ? selectedSlots.filter((slot) => slotInPeriod(slot.label, period.from, period.to))
    : [];

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedSlot) return;
    setSubmitError(null);
    try {
      const res = await api.post<{ meeting: Meeting; emailWarning?: string }>("/bookings", {
        ...values,
        slot: selectedSlot.start,
        ...(packageId ? { packageId } : {}),
      });
      setMeeting(res.data.meeting);
      setEmailWarning(res.data.emailWarning ?? null);
      setStep("done");
    } catch (err) {
      const message = getApiErrorMessage(err, "That time could not be booked.");
      setSubmitError(message);
      if (message.toLowerCase().includes("no longer available")) {
        setSelectedPeriod(null);
        setSelectedSlot(null);
        setStep("schedule");
        setAvailability(null);
        setLoading(true);
        api
          .get<Availability>("/bookings/availability", { params: { month } })
          .then((res) => setAvailability(res.data))
          .catch(() => undefined)
          .finally(() => setLoading(false));
      }
    }
  });

  const closed = availability && !availability.open && availability.reason !== "unavailable";

  return (
    <div className={styles.wrap}>
      {packageTitle ? (
        <p className={formStyles.packageContext} role="status">
          You&apos;re booking about <strong>{packageTitle}</strong>.
        </p>
      ) : null}

      {step === "done" && meeting ? (
        <div>
          <p className={styles.stepLabel}>Confirmed</p>
          <h3 className={styles.monthLabel}>You&apos;re booked</h3>
          <p className={styles.summary}>{meeting.whenLabel}</p>
          {emailWarning ? (
            <p className={formStyles.submitError}>{emailWarning}</p>
          ) : (
            <p className={styles.status}>
              A confirmation email is on its way, and the Google Meet is on your calendar.
            </p>
          )}
          <p>
            <a className={styles.meetLink} href={meeting.meetLink} target="_blank" rel="noreferrer">
              Join Google Meet
            </a>
          </p>
        </div>
      ) : null}

      {step !== "done" && closed ? (
        <p className={styles.closed}>
          Online booking is temporarily unavailable. Call, email, or WhatsApp us and we&apos;ll set up your Google Meet.
        </p>
      ) : null}

      {step === "schedule" && !closed ? (
        <>
          <div>
            <p className={styles.stepLabel}>1 · Choose a date</p>
            <p className={styles.intro}>
              Green dates have an open Google Meet. Times are shown in Egypt time.
            </p>
          </div>

          <div className={styles.monthBar}>
            <button
              type="button"
              className={styles.navBtn}
              aria-label="Previous month"
              disabled={month <= currentMonth(timezone)}
              onClick={() => {
                setSelectedDate(null);
                setSelectedPeriod(null);
                setSelectedSlot(null);
                setMonth((current) => shiftMonth(current, -1));
              }}
            >
              ‹
            </button>
            <h3 className={styles.monthLabel}>{monthTitle(month)}</h3>
            <button
              type="button"
              className={styles.navBtn}
              aria-label="Next month"
              disabled={month >= lastMonth}
              onClick={() => {
                setSelectedDate(null);
                setSelectedPeriod(null);
                setSelectedSlot(null);
                setMonth((current) => shiftMonth(current, 1));
              }}
            >
              ›
            </button>
          </div>

          <div className={styles.dow} aria-hidden>
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className={styles.days} role="grid" aria-label="Appointment calendar">
            {cells.map((cell, index) =>
              cell ? (
                <button
                  key={cell.date}
                  type="button"
                  className={`${styles.day} ${dates[cell.date]?.length ? styles.dayAvailable : ""} ${
                    selectedDate === cell.date ? styles.daySelected : ""
                  }`}
                  disabled={!dates[cell.date]?.length}
                  aria-label={`${cell.date}${dates[cell.date]?.length ? ", available" : ", unavailable"}`}
                  aria-pressed={selectedDate === cell.date}
                  onClick={() => {
                    setSelectedDate(cell.date);
                    setSelectedPeriod(null);
                    setSelectedSlot(null);
                  }}
                >
                  {dayNumber(cell.date)}
                </button>
              ) : (
                <span key={`blank-${index}`} className={styles.dayBlank} />
              ),
            )}
          </div>

          <ul className={styles.legend}>
            <li><span className={styles.swatch} aria-hidden /> Available</li>
            <li><span className={`${styles.swatch} ${styles.swatchSelected}`} aria-hidden /> Selected</li>
            <li><span className={`${styles.swatch} ${styles.swatchOff}`} aria-hidden /> Unavailable</li>
          </ul>

          {loading ? <p className={styles.notice}>Loading open times…</p> : null}
          {loadError ? <p className={formStyles.submitError}>{loadError}</p> : null}
          {availability?.reason === "unavailable" ? (
            <p className={formStyles.submitError}>We couldn&apos;t load open times. Refresh the page to try again.</p>
          ) : null}
          {!loading && availability?.open && Object.keys(dates).length === 0 ? (
            <p className={styles.notice}>No open times this month. Try the next month.</p>
          ) : null}

          {selectedDate ? (
            <div>
              <p className={styles.stepLabel}>2 · When are you available?</p>
              <p className={styles.slotsHead}>{formatDateLabel(selectedDate)}</p>
              {openPeriods.length === 0 ? (
                <p className={styles.notice}>No open times on this day.</p>
              ) : (
                <div className={styles.slots}>
                  {openPeriods.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.slot} ${selectedPeriod === item.id ? styles.slotSelected : ""}`}
                      aria-pressed={selectedPeriod === item.id}
                      onClick={() => {
                        setSelectedPeriod(item.id);
                        setSelectedSlot(null);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {period && periodSlots.length > 0 ? (
            <div>
              <p className={styles.stepLabel}>3 · Choose a time</p>
              <p className={styles.slotsHead}>Open times from {period.label}</p>
              <div className={styles.slots}>
                {periodSlots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    className={`${styles.slot} ${selectedSlot?.start === slot.start ? styles.slotSelected : ""}`}
                    aria-pressed={selectedSlot?.start === slot.start}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className={formStyles.submit}
            disabled={!selectedSlot}
            onClick={() => setStep("details")}
          >
            Continue
          </button>
        </>
      ) : null}

      {step === "details" && selectedSlot ? (
        <form className={formStyles.form} onSubmit={onSubmit} noValidate>
          <p className={styles.stepLabel}>4 · Your details</p>
          <p className={styles.summary}>
            Google Meet · {formatDateLabel(selectedDate ?? "")} · {selectedSlot.label} Egypt time
          </p>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="book-name">Name</label>
            <input id="book-name" className={formStyles.input} placeholder="Your Name" autoComplete="name" {...register("name")} />
            {errors.name?.message ? <p className={formStyles.error} role="alert">{errors.name.message}</p> : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="book-company">
              Company Name <span className={formStyles.optional}>(optional)</span>
            </label>
            <input id="book-company" className={formStyles.input} placeholder="Company Name" autoComplete="organization" {...register("company")} />
            {errors.company?.message ? <p className={formStyles.error} role="alert">{errors.company.message}</p> : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="book-phone">Phone Number</label>
            <input id="book-phone" className={formStyles.input} placeholder="Phone Number" autoComplete="tel" {...register("phone")} />
            {errors.phone?.message ? <p className={formStyles.error} role="alert">{errors.phone.message}</p> : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="book-email">Email Address</label>
            <input id="book-email" className={formStyles.input} placeholder="Email Address" autoComplete="email" {...register("email")} />
            {errors.email?.message ? <p className={formStyles.error} role="alert">{errors.email.message}</p> : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="book-message">Message</label>
            <textarea
              id="book-message"
              className={formStyles.textarea}
              placeholder="Let us know what you’re building and what you need help with."
              rows={5}
              {...register("message")}
            />
            {errors.message?.message ? <p className={formStyles.error} role="alert">{errors.message.message}</p> : null}
          </div>

          {submitError ? <p className={formStyles.submitError}>{submitError}</p> : null}
          <div className={styles.actions}>
            <button type="button" className={styles.back} onClick={() => setStep("schedule")}>
              Back
            </button>
            <button className={`${formStyles.submit} ${styles.confirm}`} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Booking..." : "Confirm meeting"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
