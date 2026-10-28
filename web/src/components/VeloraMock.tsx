import { BellRing, CalendarCheck2, Stethoscope } from "lucide-react";

const COPY = {
  en: {
    today: "Today's appointments",
    booked: "18 booked",
    rows: [
      { time: "10:00", name: "Mariam H.", doc: "Dr. Salma · Dental" },
      { time: "10:30", name: "Omar K.", doc: "Dr. Tarek · Derma" },
      { time: "11:00", name: "Online booking", doc: "Dr. Salma · Check-up" },
    ],
    checkedIn: "Checked in",
    revenue: "Today's revenue",
    noShow: "No-show rate",
    reminder: "WhatsApp reminder sent",
    reminderBody: "12 patients for tomorrow",
  },
  ar: {
    today: "مواعيد اليوم",
    booked: "18 حجزًا",
    rows: [
      { time: "10:00", name: "مريم ح.", doc: "د. سلمى · أسنان" },
      { time: "10:30", name: "عمر ك.", doc: "د. طارق · جلدية" },
      { time: "11:00", name: "حجز إلكتروني", doc: "د. سلمى · كشف" },
    ],
    checkedIn: "حضر",
    revenue: "إيراد اليوم",
    noShow: "نسبة الغياب",
    reminder: "تم إرسال تذكير واتساب",
    reminderBody: "12 مريضًا لموعد الغد",
  },
} as const;

/**
 * Illustrative Velora interface built in HTML, same approach as PolaraMock.
 * Decorative: the same information is in the page text.
 */
export default function VeloraMock({ locale }: { locale: string }) {
  const c = COPY[locale === "ar" ? "ar" : "en"];
  return (
    <div aria-hidden="true" className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3 text-[13px] select-none">
      <div className="col-span-2 rounded-2xl bg-paper p-4 text-graphite shadow-xl shadow-black/30">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-slate">
            <CalendarCheck2 size={14} /> {c.today}
          </span>
          <span className="rounded-full bg-sage-wash px-2 py-0.5 text-[11px] font-semibold text-[#2c641a]">{c.booked}</span>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {c.rows.map((r, i) => (
            <li key={r.time} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-paper-line">
              <span className="flex items-center gap-3">
                <span className="font-display font-semibold tabular-nums" dir="ltr">{r.time}</span>
                <span>
                  <span className="block font-semibold">{r.name}</span>
                  <span className="block text-[11px] text-slate">{r.doc}</span>
                </span>
              </span>
              {i === 0 && <span className="text-[11px] font-semibold text-sage-deep">{c.checkedIn}</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-ink-3 p-4 ring-1 ring-white/10">
        <p className="text-haze">{c.revenue}</p>
        <p className="mt-2 font-display text-2xl font-semibold text-fog tabular-nums" dir="ltr">EGP 14,200</p>
      </div>
      <div className="rounded-2xl bg-ink-3 p-4 ring-1 ring-white/10">
        <p className="text-haze">{c.noShow}</p>
        <p className="mt-2 font-display text-2xl font-semibold text-sage tabular-nums" dir="ltr">4%</p>
        <p className="mt-1 text-[11px] text-mist" dir="ltr">−9 pts</p>
      </div>
      <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-ink-3 p-4 ring-1 ring-white/10">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal text-fog">
          <BellRing size={16} />
        </span>
        <span className="flex-1">
          <span className="block text-fog">{c.reminder}</span>
          <span className="block text-haze">{c.reminderBody}</span>
        </span>
        <Stethoscope size={18} className="text-sage" />
      </div>
    </div>
  );
}
