import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SERVICE_SLUGS } from "@/lib/site";
import styles from "./ServiceList.module.css";

/** Numbered list of every service, linking to its page. */
export default async function ServiceList() {
  const t = await getTranslations("services.items");
  return (
    <ol className={styles.list}>
      {SERVICE_SLUGS.map((slug, i) => (
        <li key={slug} className={styles.item}>
          <Link href={`/services/${slug}`} className={styles.row} data-track="services_list" data-track-label={slug}>
            <span className={styles.index} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={styles.main}>
              <h2 className={styles.title}>{t(`${slug}.title`)}</h2>
              <span className={styles.summary}>
                <span className={styles.summaryInner}>{t(`${slug}.summary`)}</span>
              </span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              <ArrowUpRight size={34} strokeWidth={2.25} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
