import { getTranslations } from "next-intl/server";
import ButtonLink from "./ButtonLink";
import Orbit from "./Orbit";

/** Closing call to action used at the bottom of most pages. */
export default async function CtaBand({ title, body, track = "cta_band" }: { title?: string; body?: string; track?: string }) {
  const t = await getTranslations("cta");
  return (
    <section className="container-x py-20 sm:py-28" aria-labelledby="cta-title">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-ink-2 px-6 py-14 sm:px-14 sm:py-20">
        <Orbit className="pointer-events-none absolute -end-8 top-2 w-[34rem] max-w-[70%] opacity-70" />
        <div className="relative flex max-w-2xl flex-col gap-5" data-reveal>
          <h2 id="cta-title" className="text-3xl font-semibold sm:text-4xl">
            {title ?? t("title")}
          </h2>
          <p className="text-lg text-mist">{body ?? t("body")}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <ButtonLink href="/book" data-track={`${track}_book`}>
              {t("primary")}
            </ButtonLink>
            <ButtonLink href={{ pathname: "/book", query: { tab: "message" } }} variant="secondary" data-track={`${track}_message`}>
              {t("secondary")}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
