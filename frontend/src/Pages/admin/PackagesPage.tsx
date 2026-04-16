import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api from "../../lib/api";
import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";
import pkgStyles from "./PackagesPage.module.css";

type ProjectType = { _id: string; title: string };

type Pkg = {
  _id: string;
  title: string;
  description?: string;
  discount: number;
  showOnWebsite?: boolean;
  sortOrder?: number;
  project_type: ProjectType[] | string[];
};

const schema = z.object({
  title: z.string().trim().min(1, "Required"),
  description: z.string().max(4000).optional(),
  discount: z.number().min(0).max(100),
  showOnWebsite: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

type FormValues = z.infer<typeof schema>;

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<Pkg>("/package", "packages", "package");
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedPts, setSelectedPts] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pkg | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      discount: 0,
      showOnWebsite: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    api.get("/project-type").then((res) => setProjectTypes(res.data?.projectTypes ?? []));
  }, []);

  const projectTypeTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const pt of projectTypes) {
      m.set(String(pt._id), pt.title);
    }
    return m;
  }, [projectTypes]);

  const serviceLabel = (pt: ProjectType | string | { _id?: string; title?: string }) => {
    if (typeof pt === "string") {
      return projectTypeTitleById.get(pt) ?? pt;
    }
    if (pt && typeof pt === "object" && "title" in pt && pt.title) {
      return pt.title;
    }
    if (pt && typeof pt === "object" && pt._id != null) {
      const id = String(pt._id);
      return projectTypeTitleById.get(id) ?? id;
    }
    return "—";
  };

  const openCreate = () => {
    setEditing(null);
    setSelectedPts([]);
    form.reset({
      title: "",
      description: "",
      discount: 0,
      showOnWebsite: true,
      sortOrder: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (pkg: Pkg) => {
    setEditing(pkg);
    const ptIds = (pkg.project_type ?? []).map((pt) => typeof pt === "string" ? pt : pt._id);
    setSelectedPts(ptIds);
    form.reset({
      title: pkg.title,
      description: pkg.description ?? "",
      discount: pkg.discount,
      showOnWebsite: pkg.showOnWebsite !== false,
      sortOrder: pkg.sortOrder ?? 0,
    });
    setModalOpen(true);
  };

  const togglePt = (id: string) => {
    setSelectedPts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const sortOrder =
        typeof values.sortOrder === "number" && !Number.isNaN(values.sortOrder)
          ? values.sortOrder
          : 0;
      const body = {
        title: values.title,
        description: values.description ?? "",
        discount: values.discount,
        sortOrder,
        showOnWebsite: values.showOnWebsite !== false,
        project_type: selectedPts,
      };
      if (editing) {
        await update({ id: editing._id, ...body });
      } else {
        await create(body);
      }
      setModalOpen(false);
    } catch { /* */ }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<Pkg>[] = [
    { header: "Title", accessor: "title", sortable: true },
    {
      header: "Site",
      accessor: "showOnWebsite",
      sortable: true,
      render: (_, row) =>
        row.showOnWebsite === false ? (
          <span className="admin-badge" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>
            Hidden
          </span>
        ) : (
          <span className="admin-badge admin-badge-green">Live</span>
        ),
    },
    {
      header: "Order",
      accessor: "sortOrder",
      sortable: true,
      render: (v) => <span style={{ color: "#a1a1aa" }}>{Number(v) || 0}</span>,
    },
    {
      header: "Discount",
      accessor: "discount",
      sortable: true,
      render: (v) => Number(v) > 0 ? <span className="admin-badge admin-badge-green">{String(v)}%</span> : <span style={{ color: "#52525b" }}>None</span>,
    },
    {
      header: "Services",
      accessor: "project_type",
      render: (v) => {
        const arr = Array.isArray(v) ? v : [];
        return (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {arr.slice(0, 3).map((pt: ProjectType | string) => {
              const id = typeof pt === "string" ? pt : String(pt._id);
              return (
                <span key={id} className="admin-badge admin-badge-gray">
                  {serviceLabel(pt as ProjectType | string)}
                </span>
              );
            })}
            {arr.length > 3 && <span className="admin-badge admin-badge-gray">+{arr.length - 3}</span>}
          </div>
        );
      },
    },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div className={pkgStyles.tableRowActions}>
          <button
            type="button"
            className={`admin-btn admin-btn-ghost ${pkgStyles.tableIconBtn}`}
            title={`Edit package “${row.title}”`}
            aria-label={`Edit package ${row.title}`}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil size={14} aria-hidden />
          </button>
          <button
            type="button"
            className={`admin-btn admin-btn-danger ${pkgStyles.tableIconBtn}`}
            title={`Delete package “${row.title}”`}
            aria-label={`Delete package ${row.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Packages — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Packages</h2>
          <p className="admin-field-hint" style={{ margin: "0.35rem 0 0", maxWidth: "36rem" }}>
            For visitors, <strong>3–5 visible plans</strong> usually feel easier than a long grid. Turn off <strong>Show on website</strong> for bundles you want to keep internal or quote-only — they stay here in admin.
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}><Plus size={16} /> Add Package</button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable
          columns={columns}
          data={data}
          keyField="_id"
          searchFields={["title", "description"]}
          searchPlaceholder="Search packages…"
        />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Package" : "New Package"}>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">Title</label>
                <input className="admin-input" {...form.register("title")} />
                {form.formState.errors.title && <p className="admin-field-error">{form.formState.errors.title.message}</p>}
              </div>
              <div className="admin-field">
                <label className="admin-label">Discount (%)</label>
                <input className="admin-input" type="number" min={0} max={100} {...form.register("discount", { valueAsNumber: true })} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Display order</label>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  max={9999}
                  {...form.register("sortOrder", { valueAsNumber: true })}
                />
                <p className="admin-field-hint">Lower = earlier on the public Packages page.</p>
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" {...form.register("showOnWebsite")} />
                Show on website
              </label>
              <p className="admin-field-hint">
                Uncheck to hide this bundle from the public Packages page (still listed here).
              </p>
            </div>
            <div className="admin-field">
              <label className="admin-label">Public description</label>
              <p className="admin-field-hint">
                Shown on the Packages page for this bundle only. Service names still list what&apos;s included.
              </p>
              <textarea
                className="admin-input"
                rows={4}
                placeholder="Short, catchy pitch for this package…"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="admin-field-error">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="admin-field">
              <label className="admin-label">Project Types</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {projectTypes.map((pt) => {
                  const selected = selectedPts.includes(pt._id);
                  return (
                    <button
                      key={pt._id}
                      type="button"
                      className={`admin-badge ${selected ? "admin-badge-green" : "admin-badge-gray"}`}
                      style={{ cursor: "pointer", border: "none" }}
                      onClick={() => togglePt(pt._id)}
                    >
                      {selected ? "✓ " : ""}{pt.title}
                    </button>
                  );
                })}
                {projectTypes.length === 0 && <span style={{ fontSize: "0.8125rem", color: "#52525b" }}>No project types found</span>}
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : editing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Package">
        <p className="admin-confirm-text">Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
