"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { analyticsEnabled, CONSENT_EVENT, getConsent, setConsent } from "@/lib/analytics";

type Labels = { text: string; privacy: string; accept: string; decline: string; label: string };

/** Bottom consent bar for analytics/marketing cookies (only when an analytics ID is configured). */
export default function CookieConsent({ labels }: { labels: Labels }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(analyticsEnabled() && getConsent() === null);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setOpen(detail === "reopen" && analyticsEnabled());
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={labels.label}
      className="glass fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-2xl flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl px-5 py-4 shadow-2xl shadow-black/40"
    >
      <p className="min-w-0 flex-[1_1_18rem] text-sm text-mist">
        {labels.text}{" "}
        <Link href="/privacy" className="text-sage underline underline-offset-2">
          {labels.privacy}
        </Link>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConsent("denied")}
          className="min-h-10 rounded-full border border-line-strong px-4 text-sm font-semibold text-fog hover:border-mist"
        >
          {labels.decline}
        </button>
        <button
          type="button"
          onClick={() => setConsent("granted")}
          className="min-h-10 rounded-full bg-sage px-4 text-sm font-semibold text-on-sage hover:bg-sage-strong"
        >
          {labels.accept}
        </button>
      </div>
    </div>
  );
}
