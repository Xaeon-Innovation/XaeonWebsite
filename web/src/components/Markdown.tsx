import type { ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { SITE_ORIGIN } from "@/lib/site";

const isExternal = (href: string) => /^https?:\/\//.test(href) && !href.startsWith(SITE_ORIGIN);

/** Heading ids so readers (and AI answers) can link to a section. */
function headingId(children: unknown): string | undefined {
  const text = Array.isArray(children) ? children.join("") : typeof children === "string" ? children : "";
  const id = text.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return id || undefined;
}

const components: Components = {
  // The page title is the only h1: article headings start at h2.
  h1: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
  h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
  a: ({ href = "", children }) =>
    isExternal(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <a href={href}>{children}</a>
    ),
  // eslint-disable-next-line @next/next/no-img-element -- CMS images have unknown dimensions.
  img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" decoding="async" />,
  table: (props: ComponentProps<"table">) => (
    <div className="table-scroll">
      <table {...props} />
    </div>
  ),
};

/**
 * Renders CMS Markdown on the server. Raw HTML in the source is ignored and unsafe URLs
 * (javascript:, data:) are stripped by react-markdown, so admin content can't inject script.
 */
export default function Markdown({ source, className = "" }: { source: string; className?: string }) {
  return (
    <div className={`article ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
