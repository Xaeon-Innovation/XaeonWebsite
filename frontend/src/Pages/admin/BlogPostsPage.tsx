import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

import api, { getApiErrorMessage } from "../../lib/api";
import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";
import BlogEditor from "../../Components/admin/blog/BlogEditor";
import { slugify, type BlogDraft } from "../../lib/blog";

type Employee = { _id: string; name: string };

type BlogPost = {
  _id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  status: "draft" | "published";
  publishedAt?: string;
  coverImageUrl?: string;
  coverAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  author: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

const PUBLIC_SITE = (import.meta.env.VITE_PUBLIC_SITE_ORIGIN || "https://xaeons.com").replace(/\/+$/, "");

const EMPTY: BlogDraft = {
  title: "",
  slug: "",
  author: "",
  status: "draft",
  excerpt: "",
  content: "",
  tags: "",
  coverImageUrl: "",
  coverAlt: "",
  seoTitle: "",
  seoDescription: "",
};

function toDraft(p: BlogPost): BlogDraft {
  return {
    title: p.title,
    slug: p.slug ?? slugify(p.title),
    author: typeof p.author === "string" ? p.author : p.author?._id ?? "",
    status: p.status,
    excerpt: p.excerpt ?? "",
    content: p.content ?? "",
    tags: (p.tags ?? []).join(", "),
    coverImageUrl: p.coverImageUrl ?? "",
    coverAlt: p.coverAlt ?? "",
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
}

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<BlogPost>("/blog-post", "blogPosts", "blogPost");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BlogDraft>(EMPTY);
  const [slugLocked, setSlugLocked] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BlogDraft, string>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  useEffect(() => {
    api.get("/employee").then((res) => setEmployees(res.data?.employees ?? [])).catch(() => setEmployees([]));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDraft(EMPTY);
    setSlugLocked(false);
    setErrors({});
    setSaveError(null);
    setOpen(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setDraft(toDraft(p));
    setSlugLocked(true);
    setErrors({});
    setSaveError(null);
    setOpen(true);
  };

  const save = async (statusOverride?: "draft" | "published") => {
    const d = { ...draft, status: statusOverride ?? draft.status };
    const found: Partial<Record<keyof BlogDraft, string>> = {};
    if (!d.title.trim()) found.title = "Add a title";
    if (!d.author) found.author = "Choose an author";
    if (d.status === "published" && d.content.trim().length < 50) found.content = "Write at least a few sentences before publishing";
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      title: d.title.trim(),
      slug: d.slug,
      author: d.author,
      status: d.status,
      excerpt: d.excerpt.trim(),
      content: d.content,
      tags: d.tags.split(",").map((t) => t.trim()).filter(Boolean),
      coverImageUrl: d.coverImageUrl,
      coverAlt: d.coverAlt.trim(),
      seoTitle: d.seoTitle.trim(),
      seoDescription: d.seoDescription.trim(),
    };
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) await update({ id: editing._id, ...payload });
      else await create(payload);
      setOpen(false);
    } catch (e) {
      setSaveError(getApiErrorMessage(e, "Save failed. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<BlogPost>[] = [
    {
      header: "Title",
      accessor: "title",
      sortable: true,
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.title}</div>
          <div style={{ fontSize: "0.75rem", color: "#71717a" }}>/blog/{row.slug ?? "…"}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (v) => <span className={`admin-badge ${v === "published" ? "admin-badge-green" : "admin-badge-gray"}`}>{v === "published" ? "Published" : "Draft"}</span>,
    },
    {
      header: "Author",
      accessor: (row) => (typeof row.author === "object" ? row.author?.name : employees.find((e) => e._id === row.author)?.name) ?? "—",
    },
    { header: "Tags", accessor: (row) => (row.tags ?? []).join(", ") || "—" },
    {
      header: "Published",
      accessor: (row) => row.publishedAt ?? "",
      sortable: true,
      render: (v) => (v ? new Date(String(v)).toLocaleDateString() : "—"),
    },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          {row.status === "published" && row.slug ? (
            <a className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} href={`${PUBLIC_SITE}/blog/${row.slug}`} target="_blank" rel="noreferrer" aria-label={`View ${row.title} on the website`} onClick={(e) => e.stopPropagation()}>
              <ExternalLink size={14} />
            </a>
          ) : null}
          <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} aria-label={`Edit ${row.title}`} onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil size={14} /></button>
          <button type="button" className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }} aria-label={`Delete ${row.title}`} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Blog Posts — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Blog Posts</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}><Plus size={16} /> New article</button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["title"]} searchPlaceholder="Search articles…" onRowClick={openEdit} emptyText="No articles yet" />
      )}

      <FormModal open={open} onClose={() => setOpen(false)} title={editing ? "Edit article" : "New article"} wide="xl">
        {open && (
          <form className="admin-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
            <BlogEditor
              value={draft}
              onChange={setDraft}
              employees={employees}
              slugLocked={slugLocked}
              onSlugLocked={() => setSlugLocked(true)}
              errors={errors}
            />
            {saveError && <p className="admin-field-error" role="alert">{saveError}</p>}
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              {draft.status === "draft" ? (
                <>
                  <button type="submit" className="admin-btn admin-btn-ghost" disabled={saving}>{saving ? "Saving…" : "Save draft"}</button>
                  <button type="button" className="admin-btn admin-btn-primary" disabled={saving} onClick={() => void save("published")}>Publish</button>
                </>
              ) : (
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
              )}
            </div>
          </form>
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete article">
        <p className="admin-confirm-text">Delete <strong>{deleteTarget?.title}</strong>? This removes it from the website.</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
