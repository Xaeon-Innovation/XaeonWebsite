import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import { getStars } from "@/lib/api";
import Galaxy, { type GalaxyLabels } from "./Galaxy";

/** "Our galaxy of stars" section: clients from the CMS (admin → Site — Galaxy of stars). */
export default async function GalaxySection({ id = "galaxy" }: { id?: string }) {
  const [t, stars] = await Promise.all([getTranslations("galaxy"), getStars()]);
  const labels: GalaxyLabels = {
    all: t("all"),
    join: t("join"),
    joinBody: t("joinBody"),
    readCase: t("readCase"),
    visit: t("visit"),
    since: t.raw("since") as string,
    listLabel: t("listLabel"),
    empty: t("empty"),
    constellations: t.raw("constellations") as Record<string, string>,
  };
  return (
    <section className="container-x py-20 sm:py-24" aria-labelledby={`${id}-title`}>
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("body")} id={`${id}-title`} />
      <div className="mt-10">
        <Galaxy stars={stars} labels={labels} />
      </div>
    </section>
  );
}
