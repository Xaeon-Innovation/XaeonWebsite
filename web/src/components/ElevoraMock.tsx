import { CheckCircle2, MapPin } from "lucide-react";

const COPY = {
  en: {
    clockIn: "Clock-in",
    clocked: "Clocked in",
    branch: "Inside Maadi branch",
    live: "Live map",
    onMap: "on the map",
    kpi: "Q3 weighted score",
    leave: "Leave request",
    annual: "Annual · 2 days",
    approve: "Approve",
    payroll: "Payroll approved",
    staff: "52 staff",
    tasks: "Today's tasks",
    task1: "Visit Nasr City clients",
    task2: "Restock branch 4",
  },
  ar: {
    clockIn: "تسجيل الحضور",
    clocked: "تم تسجيل الحضور",
    branch: "داخل فرع المعادي",
    live: "الخريطة المباشرة",
    onMap: "على الخريطة",
    kpi: "مؤشر الربع الثالث",
    leave: "طلب إجازة",
    annual: "سنوية · يومان",
    approve: "موافقة",
    payroll: "تم اعتماد الرواتب",
    staff: "52 موظفًا",
    tasks: "مهام اليوم",
    task1: "زيارة عملاء مدينة نصر",
    task2: "إعادة تموين الفرع 4",
  },
} as const;

/**
 * Illustrative Elevora interface built in HTML (sharp at any size, no image weight).
 * Decorative: the same information is in the page text.
 */
export default function ElevoraMock({ locale }: { locale: string }) {
  const c = COPY[locale === "ar" ? "ar" : "en"];
  return (
    <div aria-hidden="true" className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3 text-[13px] select-none">
      <div className="col-span-2 rounded-2xl bg-paper p-4 text-graphite shadow-xl shadow-black/30">
        <div className="flex items-center justify-between">
          <span className="text-slate">{c.clockIn}</span>
          <span className="rounded-full bg-sage-wash px-2 py-0.5 text-[11px] font-semibold text-sage-deep">{c.clocked}</span>
        </div>
        <p className="mt-1 font-display text-3xl font-semibold tabular-nums" dir="ltr">08:02</p>
        <p className="mt-1 inline-flex items-center gap-1 text-slate">
          <MapPin size={13} /> {c.branch}
        </p>
      </div>
      <div className="rounded-2xl bg-ink-3 p-4 ring-1 ring-white/10">
        <p className="text-haze">{c.live}</p>
        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-semibold text-fog tabular-nums">31</span>
          <span className="text-haze">{c.onMap}</span>
        </p>
        <span className="mt-3 flex gap-1" >
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full bg-sage" style={{ opacity: 0.35 + (i % 3) * 0.25 }} />
          ))}
        </span>
      </div>
      <div className="rounded-2xl bg-ink-3 p-4 ring-1 ring-white/10">
        <p className="text-haze">{c.kpi}</p>
        <p className="mt-2 font-display text-2xl font-semibold text-sage tabular-nums" dir="ltr">92%</p>
        <p className="mt-1 text-[11px] text-mist" dir="ltr">+6 pts</p>
      </div>
      <div className="col-span-2 rounded-2xl bg-ink-3 p-4 ring-1 ring-white/10">
        <p className="text-haze">{c.tasks}</p>
        <ul className="mt-2 flex flex-col gap-2">
          <li className="flex items-center justify-between gap-3">
            <span className="text-fog">{c.task1}</span>
            <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-white/10"><span className="block h-full w-[60%] bg-sage" /></span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="text-fog">{c.task2}</span>
            <CheckCircle2 size={16} className="text-sage" />
          </li>
        </ul>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 rounded-2xl bg-ink-3 p-4 ring-1 ring-white/10">
        <span className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[12px] font-semibold text-fog">YN</span>
          <span>
            <span className="block text-fog">{c.leave}</span>
            <span className="block text-haze">{c.annual}</span>
          </span>
        </span>
        <span className="rounded-full bg-sage px-3 py-1 text-[12px] font-semibold text-on-sage">{c.approve}</span>
      </div>
    </div>
  );
}
