import { Plus } from "lucide-react";
import JsonLd from "./JsonLd";
import { faqJsonLd } from "@/lib/seo";

type Item = { q: string; a: string };

/** Native <details> accordion: works without JavaScript and is fully crawlable. */
export default function Faq({ items, tone = "dark", withSchema = true }: { items: Item[]; tone?: "dark" | "light"; withSchema?: boolean }) {
  const light = tone === "light";
  return (
    <>
      <div className={`divide-y ${light ? "divide-paper-line border-paper-line" : "divide-line border-line"} border-y`}>
        {items.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 [&::-webkit-details-marker]:hidden">
              <h3 className={`font-sans text-lg font-semibold ${light ? "text-graphite" : "text-fog"}`}>{item.q}</h3>
              <Plus
                size={20}
                aria-hidden
                className={`mt-1 shrink-0 transition-transform duration-200 group-open:rotate-45 ${light ? "text-sage-deep" : "text-sage"}`}
              />
            </summary>
            <p className={`mt-3 max-w-3xl ${light ? "text-slate" : "text-mist"}`}>{item.a}</p>
          </details>
        ))}
      </div>
      {withSchema ? <JsonLd data={faqJsonLd(items)} /> : null}
    </>
  );
}
