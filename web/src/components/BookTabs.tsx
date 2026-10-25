"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import BookingCalendar from "./BookingCalendar";
import EnquiryForm from "./EnquiryForm";

type Tab = "meet" | "message";

/** Meeting booking or message, chosen by tabs; `?tab=message` and `?package=<id>` preselect. */
export default function BookTabs() {
  const t = useTranslations("book");
  const searchParams = useSearchParams();
  const packageParam = searchParams.get("package") ?? "";
  const packageId = /^[a-f0-9]{24}$/i.test(packageParam) ? packageParam : undefined;
  const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "message" ? "message" : "meet");
  const [packageTitle, setPackageTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!packageId) return;
    let cancelled = false;
    fetch(`/api/v1/package/${packageId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { package?: { title?: string } } | null) => !cancelled && setPackageTitle(d?.package?.title ?? null))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  const tabClass = (active: boolean) =>
    `min-h-11 flex-1 rounded-full px-4 text-sm font-semibold transition-colors ${
      active ? "bg-sage text-on-sage" : "text-mist hover:text-fog"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {packageTitle ? (
        <p role="status" className="rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-fog">
          {t("packageContext", { package: packageTitle })}
        </p>
      ) : null}
      <div role="tablist" aria-label={t("title")} className="flex gap-1 rounded-full border border-line p-1">
        <button type="button" role="tab" id="tab-meet" aria-selected={tab === "meet"} aria-controls="panel-meet" className={tabClass(tab === "meet")} onClick={() => setTab("meet")}>
          {t("tabMeet")}
        </button>
        <button type="button" role="tab" id="tab-message" aria-selected={tab === "message"} aria-controls="panel-message" className={tabClass(tab === "message")} onClick={() => setTab("message")}>
          {t("tabMessage")}
        </button>
      </div>
      <div role="tabpanel" id="panel-meet" aria-labelledby="tab-meet" hidden={tab !== "meet"}>
        {tab === "meet" ? <BookingCalendar packageId={packageId} /> : null}
      </div>
      <div role="tabpanel" id="panel-message" aria-labelledby="tab-message" hidden={tab !== "message"}>
        {tab === "message" ? (
          <EnquiryForm
            source={packageId ? "package" : "contact"}
            packageId={packageId}
            interest={packageTitle ?? undefined}
            idPrefix="book"
          />
        ) : null}
      </div>
    </div>
  );
}
