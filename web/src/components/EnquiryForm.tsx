"use client";

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAttribution } from "@/lib/attribution";
import { trackLead } from "@/lib/analytics";

type Source = "contact" | "service" | "package" | "product";

type Props = {
  source: Source;
  /** Service or product name the enquiry is about. */
  interest?: string;
  packageId?: string;
  /** Show a "team size" field (product demo requests). */
  askTeamSize?: boolean;
  idPrefix?: string;
};

type Field = "name" | "phone" | "email" | "message";
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EnquiryForm({ source, interest, packageId, askTeamSize = false, idPrefix = "enq" }: Props) {
  const t = useTranslations("form");
  const locale = useLocale();
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (data: FormData): Errors => {
    const next: Errors = {};
    const get = (k: string) => String(data.get(k) ?? "").trim();
    if (get("name").length < 2) next.name = t("errors.name");
    if (get("phone").replace(/[^\d]/g, "").length < 7) next.phone = t("errors.phone");
    if (!EMAIL_RE.test(get("email"))) next.email = t("errors.email");
    if (get("message").length < 10) next.message = t("errors.message");
    return next;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const get = (k: string) => String(data.get(k) ?? "").trim();
    const teamSize = get("teamSize");
    const message = teamSize ? `Team size: ${teamSize}\n\n${get("message")}` : get("message");

    setStatus("sending");
    try {
      const res = await fetch("/api/v1/system-request/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceRequest: {
            source,
            name: get("name"),
            company: get("company") || undefined,
            phone: get("phone"),
            email: get("email"),
            message,
            website: get("website"),
            ...(interest ? { interest } : {}),
            ...(source === "package" && packageId ? { packageId } : {}),
            attribution: getAttribution() ?? undefined,
            locale,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackLead(source, { interest });
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border border-sage/30 bg-sage/10 p-6">
        <CheckCircle2 size={28} aria-hidden className="text-sage" />
        <p className="font-display text-xl font-semibold text-fog">{t("successTitle")}</p>
        <p className="text-mist">{t("success")}</p>
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-line-strong bg-ink-2 px-4 py-3 text-fog placeholder:text-haze focus:border-sage focus:outline-none aria-[invalid=true]:border-danger";
  const label = "text-sm font-medium text-fog";
  const field = (name: Field) => ({
    id: `${idPrefix}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${idPrefix}-${name}-err` : undefined,
  });
  const err = (name: Field) =>
    errors[name] ? (
      <p id={`${idPrefix}-${name}-err`} className="text-sm text-danger">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {/* Honeypot: hidden from people; bots fill it and the API silently drops the request. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -start-[10000px] h-px w-px opacity-0" />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${idPrefix}-name`} className={label}>{t("name")}</label>
          <input {...field("name")} autoComplete="name" className={input} />
          {err("name")}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${idPrefix}-company`} className={label}>
            {t("company")} <span className="font-normal text-haze">({t("optional")})</span>
          </label>
          <input id={`${idPrefix}-company`} name="company" autoComplete="organization" className={input} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${idPrefix}-phone`} className={label}>{t("phone")}</label>
          <input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className={`${input} rtl:text-right`} />
          {err("phone")}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${idPrefix}-email`} className={label}>{t("email")}</label>
          <input {...field("email")} type="email" inputMode="email" autoComplete="email" dir="ltr" className={`${input} rtl:text-right`} />
          {err("email")}
        </div>
        {askTeamSize ? (
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor={`${idPrefix}-teamSize`} className={label}>
              {t("teamSize")} <span className="font-normal text-haze">({t("optional")})</span>
            </label>
            <input id={`${idPrefix}-teamSize`} name="teamSize" placeholder={t("teamSizePlaceholder")} className={input} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${idPrefix}-message`} className={label}>{t("message")}</label>
        <textarea {...field("message")} rows={5} placeholder={t("messagePlaceholder")} className={input} />
        {err("message")}
      </div>

      {status === "error" ? <p role="alert" className="text-sm text-danger">{t("errorGeneric")}</p> : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-sage px-6 font-semibold text-on-sage transition-colors hover:bg-sage-strong disabled:opacity-60"
        >
          {status === "sending" ? t("sending") : t("submit")}
        </button>
        <p className="text-xs text-haze">
          {t.rich("consentNote", {
            link: (chunks) => (
              <Link href="/privacy" className="underline underline-offset-2 hover:text-fog">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </form>
  );
}
