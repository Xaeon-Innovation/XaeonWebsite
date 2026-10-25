import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import JsonLd from "./JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export type Crumb = { name: string; href: string; url: string };

/** Visible breadcrumb trail + BreadcrumbList structured data. Last item is the current page. */
export default function Breadcrumbs({ items, tone = "dark" }: { items: Crumb[]; tone?: "dark" | "light" }) {
  const muted = tone === "light" ? "text-slate" : "text-haze";
  return (
    <>
      <nav aria-label="Breadcrumb" className={`text-sm ${muted}`}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1.5 min-w-0">
                {last ? (
                  <span aria-current="page" className={`truncate ${tone === "light" ? "text-graphite" : "text-fog"}`}>
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.href} className="hover:underline underline-offset-4">
                      {item.name}
                    </Link>
                    <ChevronRight size={14} aria-hidden className="rtl:rotate-180 shrink-0" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items.map((i) => ({ name: i.name, url: i.url })))} />
    </>
  );
}
