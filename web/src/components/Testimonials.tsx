import Image from "next/image";
import { Quote } from "lucide-react";
import type { Testimonial } from "@/lib/api";
import SectionHeading from "./SectionHeading";

/** Client quotes from the CMS. Renders nothing until real testimonials are published. */
export default function Testimonials({ items, eyebrow, title }: { items: Testimonial[]; eyebrow: string; title: string }) {
  if (items.length === 0) return null;
  const logos = items.filter((t) => t.logoUrl);
  return (
    <section className="container-x py-20 sm:py-28" aria-labelledby="testimonials-title">
      <SectionHeading eyebrow={eyebrow} title={title} id="testimonials-title" />
      {logos.length >= 3 ? (
        <ul className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6 opacity-80" aria-label="Clients">
          {logos.map((t) => (
            <li key={t._id}>
              <Image src={t.logoUrl!} alt={t.company || t.name} width={140} height={40} className="h-8 w-auto object-contain brightness-0 invert" />
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <li key={t._id} className="glass flex flex-col gap-5 rounded-[var(--radius-card)] p-7" data-reveal>
            <Quote size={22} aria-hidden className="text-sage" />
            <blockquote className="text-fog">
              <p>{t.quote}</p>
            </blockquote>
            <footer className="mt-auto text-sm">
              <p className="font-semibold text-fog">{t.name}</p>
              {t.role || t.company ? <p className="text-haze">{[t.role, t.company].filter(Boolean).join(" · ")}</p> : null}
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}
