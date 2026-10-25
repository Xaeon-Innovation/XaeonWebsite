import { getTranslations } from "next-intl/server";
import ButtonLink from "@/components/ButtonLink";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-start justify-center gap-5 py-24">
      <p className="eyebrow">404</p>
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      <p className="text-lg text-mist">{t("body")}</p>
      <ButtonLink href="/">{t("home")}</ButtonLink>
    </section>
  );
}
