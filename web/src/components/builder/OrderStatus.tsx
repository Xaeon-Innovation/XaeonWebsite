"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type Status = { ref: string; status: string; paymentStatus: string; businessName: string } | null;

/** Builder success / payment-return page body: polls the order until the deposit settles. */
export default function OrderStatus() {
  const t = useTranslations("builder.success");
  const params = useSearchParams();
  const ref = params.get("ref") ?? "";
  const token = params.get("token") ?? "";
  const [state, setState] = useState<Status | "missing" | "loading">("loading");

  useEffect(() => {
    if (!ref || !token) {
      // no order in the URL: nothing to poll
      setState("missing");
      return;
    }
    let stop = false;
    let tries = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/api/v1/builder/orders/${encodeURIComponent(ref)}/status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as NonNullable<Status>;
        if (stop) return;
        setState(json);
        tries += 1;
        // Payment webhooks usually land within seconds; keep checking for ~2 minutes.
        if (json.paymentStatus === "pending" && tries < 40) window.setTimeout(poll, 3000);
      } catch {
        if (!stop) setState("missing");
      }
    };
    void poll();
    return () => {
      stop = true;
    };
  }, [ref, token]);

  if (state === "loading") return <p className="text-mist" role="status">…</p>;
  if (state === "missing" || !state) return <p className="text-lg text-mist" role="status">{t("missing")}</p>;

  const { Icon, tone, text } =
    state.paymentStatus === "paid"
      ? { Icon: CheckCircle2, tone: "text-sage", text: t("paid") }
      : state.paymentStatus === "failed"
        ? { Icon: XCircle, tone: "text-danger", text: t("failed") }
        : state.paymentStatus === "pending"
          ? { Icon: Clock, tone: "text-haze", text: t("pending") }
          : { Icon: CheckCircle2, tone: "text-sage", text: t("submitted") };

  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <p className="text-lg text-mist">{t("body", { ref: state.ref })}</p>
      <p className="flex items-start gap-3 rounded-2xl border border-line bg-ink-2 p-5 text-fog">
        <Icon size={22} aria-hidden className={`mt-0.5 shrink-0 ${tone}`} />
        <span>{text}</span>
      </p>
    </div>
  );
}
