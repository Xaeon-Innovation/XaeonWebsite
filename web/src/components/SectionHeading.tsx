import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  as?: "h1" | "h2";
  align?: "start" | "center";
  tone?: "dark" | "light";
  id?: string;
};

export default function SectionHeading({ eyebrow, title, intro, as = "h2", align = "start", tone = "dark", id }: Props) {
  const Heading = as;
  const centered = align === "center";
  return (
    <div className={`flex flex-col gap-4 ${centered ? "items-center text-center mx-auto" : ""} max-w-3xl`} data-reveal>
      {eyebrow ? <p className={`eyebrow ${tone === "light" ? "!text-sage-deep" : ""}`}>{eyebrow}</p> : null}
      <Heading
        id={id}
        className={`${as === "h1" ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl"} font-semibold ${
          tone === "light" ? "text-graphite" : "text-fog"
        }`}
      >
        {title}
      </Heading>
      {intro ? (
        <p className={`text-lg max-w-2xl ${tone === "light" ? "text-slate" : "text-mist"}`}>{intro}</p>
      ) : null}
    </div>
  );
}
