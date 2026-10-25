type Step = { title: string; body: string };

/** Numbered steps: the numbers carry meaning here (it's a real sequence). */
export default function ProcessSteps({ steps, tone = "dark" }: { steps: Step[]; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <ol className={`grid gap-6 ${steps.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {steps.map((step, i) => (
        <li key={step.title} className="flex flex-col gap-3" data-reveal style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}>
          <span className={`font-display text-sm font-semibold ${light ? "text-sage-deep" : "text-sage"}`} aria-hidden>
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className={`h-px w-full ${light ? "bg-paper-line" : "bg-line"}`} aria-hidden />
          <h3 className={`font-sans text-lg font-semibold ${light ? "text-graphite" : "text-fog"}`}>{step.title}</h3>
          <p className={light ? "text-slate" : "text-mist"}>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
