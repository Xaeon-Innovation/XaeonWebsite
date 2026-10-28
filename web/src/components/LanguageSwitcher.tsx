"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/** Switches between English and Arabic on the same page. */
export default function LanguageSwitcher({ label, ariaLabel, className = "" }: { label: string; ariaLabel: string; className?: string }) {
  const locale = useLocale();
  // Locale-free path with dynamic segments already filled in, e.g. "/services/websites".
  const pathname = usePathname();
  const target = locale === "ar" ? "en" : "ar";
  return (
    <Link
      href={pathname}
      locale={target}
      hrefLang={target}
      lang={target}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-mist hover:text-fog ${className}`}
    >
      <Languages size={16} aria-hidden />
      <span>{label}</span>
      {/* Spoken name keeps the visible word first (WCAG 2.5.3 "label in name"), then explains it in the page's language. */}
      <span className="sr-only" lang={locale}>
        {" "}({ariaLabel})
      </span>
    </Link>
  );
}
