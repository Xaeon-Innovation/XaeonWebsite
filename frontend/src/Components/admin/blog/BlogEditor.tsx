import { useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote } from "lucide-react";
import { getApiErrorMessage } from "../../../lib/api";
import { uploadSiteAsset } from "../../../lib/siteUpload";
import { slugify, type BlogDraft } from "../../../lib/blog";
import styles from "./BlogEditor.module.css";



type Props = {
  value: BlogDraft;
  onChange: (next: BlogDraft) => void;
  employees: { _id: string; name: string }[];
  /** Slug follows the title until someone edits it by hand. */
  slugLocked: boolean;
  onSlugLocked: () => void;
  errors: Partial<Record<keyof BlogDraft, string>>;
};


function Counter({ value, ideal, max }: { value: string; ideal: [number, number]; max: number }) {
  const n = value.length;
  const tone = n === 0 ? "" : n > max ? styles.over : n < ideal[0] || n > ideal[1] ? styles.warn : styles.good;
  return <span className={`${styles.counter} ${tone}`}>{n}/{max}</span>;
}

export default function BlogEditor({ value, onChange, employees, slugLocked, onSlugLocked, errors }: Props) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState<"cover" | "inline" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  // Selection to restore once React has written the new text into the textarea.
  const pendingSelection = useRef<[number, number] | null>(null);

  useLayoutEffect(() => {
    const sel = pendingSelection.current;
    const el = textRef.current;
    if (!sel || !el) return;
    pendingSelection.current = null;
    el.focus();
    el.setSelectionRange(sel[0], sel[1]);
  }, [value.content]);
  const inlineFileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof BlogDraft>(key: K, v: BlogDraft[K]) => {
    const next = { ...value, [key]: v };
    if (key === "title" && !slugLocked) next.slug = slugify(String(v));
    onChange(next);
  };

  /** Wraps the selection (or inserts a placeholder) with Markdown syntax. */
  const wrap = (before: string, after = "", placeholder = "text", linePrefix = false) => {
    const el = textRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const hadSelection = e > s;
    const selected = value.content.slice(s, e) || placeholder;
    let insert: string;
    let lead = 0;
    if (linePrefix) {
      insert = selected.split("\n").map((l, i) => (before === "1. " ? `${i + 1}. ` : before) + l).join("\n");
      const atLineStart = s === 0 || value.content[s - 1] === "\n";
      if (!atLineStart) {
        insert = `\n${insert}`;
        lead = 1;
      }
    } else {
      insert = `${before}${selected}${after}`;
    }
    const content = value.content.slice(0, s) + insert + value.content.slice(e);
    if (!hadSelection && placeholder) {
      // Select the placeholder so typing replaces it, like other editors.
      const start = s + lead + (linePrefix ? (before === "1. " ? 3 : before.length) : before.length);
      pendingSelection.current = [start, start + placeholder.length];
    } else {
      pendingSelection.current = [s + insert.length, s + insert.length];
    }
    onChange({ ...value, content });
  };

  const upload = async (file: File | undefined, target: "cover" | "inline") => {
    if (!file) return;
    setUploading(target);
    setUploadError(null);
    try {
      const url = await uploadSiteAsset(file, "blog");
      if (target === "cover") {
        onChange({ ...value, coverImageUrl: url });
      } else {
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        wrap(`![${alt}](${url})`, "", "", false);
      }
    } catch (e) {
      setUploadError(getApiErrorMessage(e, "Upload failed"));
    } finally {
      setUploading(null);
    }
  };

  const tools: { label: string; icon: typeof Bold; run: () => void }[] = [
    { label: "Heading", icon: Heading2, run: () => wrap("## ", "", "Section heading", true) },
    { label: "Subheading", icon: Heading3, run: () => wrap("### ", "", "Subheading", true) },
    { label: "Bold", icon: Bold, run: () => wrap("**", "**", "bold text") },
    { label: "Italic", icon: Italic, run: () => wrap("_", "_", "italic text") },
    { label: "Link", icon: Link2, run: () => wrap("[", "](https://)", "link text") },
    { label: "Bulleted list", icon: List, run: () => wrap("- ", "", "List item", true) },
    { label: "Numbered list", icon: ListOrdered, run: () => wrap("1. ", "", "List item", true) },
    { label: "Quote", icon: Quote, run: () => wrap("> ", "", "Quote", true) },
  ];

  const field = (key: keyof BlogDraft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(key, e.target.value as never);
  const err = (key: keyof BlogDraft) => (errors[key] ? <p className="admin-field-error">{errors[key]}</p> : null);
  const snippetTitle = value.seoTitle || value.title || "Article title";
  const snippetDesc = value.seoDescription || value.excerpt || "The excerpt shows here in search results.";

  return (
    <div className={styles.editor}>
      <div className={styles.main}>
        <label className="admin-field">
          <span className="admin-label">Title</span>
          <input className="admin-input" value={value.title} onChange={field("title")} maxLength={200} />
          {err("title")}
        </label>
        <label className="admin-field">
          <span className="admin-label">Address</span>
          <span className={styles.slugRow}>
            <span className={styles.slugPrefix}>xaeons.com/blog/</span>
            <input
              className="admin-input"
              value={value.slug}
              onChange={(e) => {
                onSlugLocked();
                set("slug", slugify(e.target.value));
              }}
              maxLength={80}
              aria-label="URL slug"
            />
          </span>
          <span className="admin-field-hint">Changing it later is safe: old links redirect.</span>
        </label>
        <label className="admin-field">
          <span className="admin-label">Excerpt <span className={styles.muted}>(shown on cards, in search results and AI answers)</span></span>
          <textarea className="admin-textarea" rows={2} value={value.excerpt} onChange={field("excerpt")} maxLength={400} />
          <Counter value={value.excerpt} ideal={[120, 200]} max={400} />
        </label>

        <div className="admin-field">
          <div className={styles.bodyHead}>
            <span className="admin-label">Article</span>
            <div className={styles.tabs} role="tablist" aria-label="Editor mode">
              <button type="button" role="tab" aria-selected={tab === "write"} onClick={() => setTab("write")}>Write</button>
              <button type="button" role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")}>Preview</button>
            </div>
          </div>
          {tab === "write" ? (
            <>
              <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
                {tools.map(({ label, icon: Icon, run }) => (
                  <button key={label} type="button" onClick={run} title={label} aria-label={label}>
                    <Icon size={15} />
                  </button>
                ))}
                <button type="button" onClick={() => inlineFileRef.current?.click()} title="Insert image" aria-label="Insert image" disabled={uploading !== null}>
                  <ImagePlus size={15} />
                </button>
                <input ref={inlineFileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { void upload(e.target.files?.[0], "inline"); e.target.value = ""; }} />
                {uploading === "inline" ? <span className={styles.muted}>Uploading…</span> : null}
              </div>
              <textarea
                ref={textRef}
                className={`admin-textarea ${styles.body}`}
                rows={18}
                value={value.content}
                onChange={field("content")}
                placeholder={"Start with a short answer to the reader's question, then go deeper.\n\n## A section heading\n\nWrite in plain paragraphs. Use **bold** for key terms and lists for steps."}
              />
            </>
          ) : (
            <div className={styles.preview}>
              {value.content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{value.content}</ReactMarkdown>
              ) : (
                <p className={styles.muted}>Nothing to preview yet.</p>
              )}
            </div>
          )}
          {err("content")}
        </div>
      </div>

      <aside className={styles.side}>
        <label className="admin-field">
          <span className="admin-label">Status</span>
          <select className="admin-select" value={value.status} onChange={field("status")}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="admin-field">
          <span className="admin-label">Author</span>
          <select className="admin-select" value={value.author} onChange={field("author")}>
            <option value="">Choose…</option>
            {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
          {err("author")}
        </label>
        <label className="admin-field">
          <span className="admin-label">Tags <span className={styles.muted}>(comma separated)</span></span>
          <input className="admin-input" value={value.tags} onChange={field("tags")} placeholder="ai, web apps, case study" />
        </label>

        <div className="admin-field">
          <span className="admin-label">Cover image</span>
          {value.coverImageUrl ? <img src={value.coverImageUrl} alt="" className={styles.cover} /> : null}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="admin-input" onChange={(e) => void upload(e.target.files?.[0], "cover")} disabled={uploading !== null} aria-label="Upload cover image" />
          {uploading === "cover" ? <span className={styles.muted}>Uploading…</span> : null}
          {value.coverImageUrl ? (
            <>
              <input className="admin-input" value={value.coverAlt} onChange={field("coverAlt")} placeholder="Describe the image for screen readers" aria-label="Cover alt text" maxLength={200} />
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onChange({ ...value, coverImageUrl: "", coverAlt: "" })}>Remove cover</button>
            </>
          ) : null}
        </div>
        {uploadError ? <p className="admin-field-error">{uploadError}</p> : null}

        <fieldset className={styles.seo}>
          <legend className="admin-label">Search appearance</legend>
          <label className="admin-field">
            <span className={styles.muted}>SEO title (optional)</span>
            <input className="admin-input" value={value.seoTitle} onChange={field("seoTitle")} maxLength={70} />
            <Counter value={value.seoTitle} ideal={[30, 60]} max={70} />
          </label>
          <label className="admin-field">
            <span className={styles.muted}>Meta description (optional)</span>
            <textarea className="admin-textarea" rows={3} value={value.seoDescription} onChange={field("seoDescription")} maxLength={170} />
            <Counter value={value.seoDescription} ideal={[110, 160]} max={170} />
          </label>
          <div className={styles.snippet} aria-label="Search result preview">
            <span className={styles.snippetUrl}>xaeons.com › blog › {value.slug || "…"}</span>
            <span className={styles.snippetTitle}>{snippetTitle.length > 60 ? `${snippetTitle.slice(0, 58)}…` : snippetTitle}</span>
            <span className={styles.snippetDesc}>{snippetDesc.length > 160 ? `${snippetDesc.slice(0, 157)}…` : snippetDesc}</span>
          </div>
        </fieldset>
      </aside>
    </div>
  );
}
