import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ServiceIcon from "./ServiceIcon";
import { SERVICE_SLUGS, type ServiceSlug } from "@/lib/site";

/** Cards linking to each service page. `exclude` hides the current service on detail pages. */
export default async function ServiceGrid({ exclude, headingLevel = "h3" }: { exclude?: ServiceSlug; headingLevel?: "h2" | "h3" }) {
  const t = await getTranslations("services.items");
  const Heading = headingLevel;
  // On a service page, show four related services (a full row) rather than the other seven.
  const slugs = SERVICE_SLUGS.filter((s) => s !== exclude).slice(0, exclude ? 4 : undefined);
  return (
    <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {slugs.map((slug, i) => (
        <li key={slug} className="bg-ink" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 4) * 60}ms` }}>
          <Link
            href={`/services/${slug}`}
            className="group flex h-full flex-col gap-4 p-6 transition-colors hover:bg-ink-2 sm:p-7"
          >
            <span className="flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sage/10 text-sage">
                <ServiceIcon slug={slug} />
              </span>
              <ArrowUpRight
                size={18}
                aria-hidden
                className="text-haze transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sage rtl:-scale-x-100"
              />
            </span>
            <Heading className="font-sans text-lg font-semibold text-fog">{t(`${slug}.title`)}</Heading>
            <p className="text-sm text-mist">{t(`${slug}.summary`)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
