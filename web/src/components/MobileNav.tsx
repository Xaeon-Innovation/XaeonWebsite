"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { buttonClass } from "./ButtonLink";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLink from "./NavLink";

type Props = {
  items: { href: string; label: string }[];
  labels: { open: string; close: string; book: string; clientLogin: string; language: string; languageLabel: string };
  clientLoginHref: string;
};

export default function MobileNav({ items, labels, clientLoginHref }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation and on Escape; lock page scroll while open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? labels.close : labels.open}
        className="-me-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-fog hover:bg-white/5"
      >
        {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
      </button>
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[4.25rem] z-40 overflow-y-auto border-t border-line bg-ink px-[max(1.25rem,env(safe-area-inset-left))] pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6"
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} className="!rounded-xl !px-4 !py-3 !text-lg">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
          <Link href="/book" className={buttonClass("primary", "w-full")} data-track="mobile_nav_book_now">
            {labels.book}
          </Link>
          <div className="flex items-center justify-between">
            <a href={clientLoginHref} className="px-1 py-2 text-mist hover:text-fog">
              {labels.clientLogin}
            </a>
            <LanguageSwitcher label={labels.language} ariaLabel={labels.languageLabel} />
          </div>
        </div>
      </div>
    </div>
  );
}
