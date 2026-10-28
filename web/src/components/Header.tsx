import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "./ButtonLink";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileNav from "./MobileNav";
import NavLink from "./NavLink";
import { APP_ORIGIN } from "@/lib/site";

export const NAV_ITEMS = [
  { href: "/services", key: "services" },
  { href: "/website-builder", key: "websiteBuilder" },
  { href: "/products", key: "products" },
  { href: "/work", key: "work" },
  { href: "/packages", key: "packages" },
  { href: "/about", key: "about" },
  { href: "/blog", key: "blog" },
] as const;

export default async function Header() {
  const t = await getTranslations("nav");
  const items = NAV_ITEMS.map((item) => ({ href: item.href, label: t(item.key) }));

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/85 backdrop-blur-md supports-[not(backdrop-filter:blur(1px))]:bg-ink">
      <div className="container-x flex h-[4.25rem] items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="Xaeon — home">
          <Image src="/logo.webp" alt="Xaeon" width={100} height={48} priority className="h-9 w-auto" />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={`${APP_ORIGIN}/login`} className="text-sm text-mist hover:text-fog px-2 py-2">
            {t("clientLogin")}
          </a>
          <LanguageSwitcher label={t("language")} ariaLabel={t("languageLabel")} />
          <Link href="/book" className={buttonClass("primary", "!py-2.5")} data-track="nav_book_now">
            {t("book")}
          </Link>
        </div>

        <MobileNav
          items={items}
          labels={{
            open: t("openMenu"),
            close: t("closeMenu"),
            book: t("book"),
            clientLogin: t("clientLogin"),
            language: t("language"),
            languageLabel: t("languageLabel"),
          }}
          clientLoginHref={`${APP_ORIGIN}/login`}
        />
      </div>
    </header>
  );
}
