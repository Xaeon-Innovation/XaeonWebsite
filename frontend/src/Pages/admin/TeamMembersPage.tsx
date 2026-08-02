import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api, { getApiErrorMessage } from "../../lib/api";
import { uploadSiteAsset } from "../../lib/siteUpload";
import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";

type TeamMember = {
  _id: string;
  name: string;
  role: string;
  photoUrl: string;
  sortOrder: number;
  published: boolean;
};

type SiteSettingsSnapshot = {
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  emailUrl: string;
  showTeamSection: boolean;
};

const sortOrderSchema = z.preprocess((v) => {
  if (v === "" || v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}, z.number().int());

const schema = z.object({
  name: z.string().trim().min(1, "Required"),
  role: z.string().trim().min(1, "Required"),
  photoUrl: z.string().trim().min(1, "Required").refine((s) => URL.canParse(s), "Must be a valid URL"),
  sortOrder: sortOrderSchema,
  published: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<TeamMember>(
    "/team-member",
    "teamMembers",
    "teamMember"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [uploading, setUploading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsSnapshot | null>(null);
  const [sectionBusy, setSectionBusy] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    mode: "onBlur",
    defaultValues: { name: "", role: "", photoUrl: "", sortOrder: 0, published: false },
  });

  const loadSiteSettings = useCallback(async () => {
    const res = await api.get<{ siteSettings?: Partial<SiteSettingsSnapshot> }>("/admin/site-settings");
    const s = res.data?.siteSettings;
    if (!s) return null;
    const snapshot: SiteSettingsSnapshot = {
      facebookUrl: s.facebookUrl ?? "",
      instagramUrl: s.instagramUrl ?? "",
      linkedinUrl: s.linkedinUrl ?? "",
      twitterUrl: s.twitterUrl ?? "",
      emailUrl: s.emailUrl ?? "mailto:info@xaeons.com",
      showTeamSection: s.showTeamSection !== false,
    };
    setSiteSettings(snapshot);
    return snapshot;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadSiteSettings().catch((e) => {
      if (!cancelled) setSectionError(getApiErrorMessage(e, "Failed to load section visibility"));
    });
    return () => {
      cancelled = true;
    };
  }, [loadSiteSettings]);

  const toggleSectionVisibility = async () => {
    setSectionError(null);
    setSectionBusy(true);
    try {
      const current = siteSettings ?? (await loadSiteSettings());
      if (!current) {
        setSectionError("Could not load site settings");
        return;
      }
      const nextShow = !current.showTeamSection;
      const res = await api.put<{ siteSettings?: Partial<SiteSettingsSnapshot> }>("/admin/site-settings", {
        siteSettings: {
          facebookUrl: current.facebookUrl,
          instagramUrl: current.instagramUrl,
          linkedinUrl: current.linkedinUrl,
          twitterUrl: current.twitterUrl,
          emailUrl: current.emailUrl,
          showTeamSection: nextShow,
        },
      });
      const s = res.data?.siteSettings;
      setSiteSettings({
        facebookUrl: s?.facebookUrl ?? current.facebookUrl,
        instagramUrl: s?.instagramUrl ?? current.instagramUrl,
        linkedinUrl: s?.linkedinUrl ?? current.linkedinUrl,
        twitterUrl: s?.twitterUrl ?? current.twitterUrl,
        emailUrl: s?.emailUrl ?? current.emailUrl,
        showTeamSection: typeof s?.showTeamSection === "boolean" ? s.showTeamSection : nextShow,
      });
    } catch (e) {
      setSectionError(getApiErrorMessage(e, "Failed to update section visibility"));
    } finally {
      setSectionBusy(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", role: "", photoUrl: "", sortOrder: data.length, published: true });
    setModalOpen(true);
  };

  const openEdit = (row: TeamMember) => {
    setEditing(row);
    form.reset({
      name: row.name,
      role: row.role,
      photoUrl: row.photoUrl,
      sortOrder: row.sortOrder ?? 0,
      published: row.published ?? false,
    });
    setModalOpen(true);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadSiteAsset(file, "team");
      form.setValue("photoUrl", url, { shouldValidate: true });
    } catch {
      /* toast optional */
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await update({ id: editing._id, ...values });
      } else {
        await create(values);
      }
      setModalOpen(false);
    } catch {
      /* */
    }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<TeamMember>[] = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "Role", accessor: "role", sortable: true },
    {
      header: "Photo",
      accessor: "photoUrl",
      render: (v) =>
        typeof v === "string" && v ? (
          <img src={v} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} />
        ) : (
          "—"
        ),
    },
    {
      header: "Order",
      accessor: "sortOrder",
      sortable: true,
    },
    {
      header: "Pub",
      accessor: "published",
      render: (v) => (v ? "Yes" : "No"),
    },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            style={{ padding: "4px 8px" }}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            style={{ padding: "4px 8px" }}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Team (About) — Xaeon Admin</title>
      </Helmet>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">About — Team members</h2>
          {siteSettings && !siteSettings.showTeamSection && (
            <p style={{ margin: "6px 0 0", color: "#a1a1aa", fontSize: "0.875rem" }}>
              Section hidden on About page
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={toggleSectionVisibility}
            disabled={sectionBusy || siteSettings === null}
            title={
              siteSettings?.showTeamSection
                ? "Hide the Meet Our Team section on the About page"
                : "Show the Meet Our Team section on the About page"
            }
          >
            {siteSettings?.showTeamSection !== false ? <EyeOff size={16} /> : <Eye size={16} />}
            {sectionBusy
              ? "Saving…"
              : siteSettings?.showTeamSection !== false
                ? "Hide section"
                : "Show section"}
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add member
          </button>
        </div>
      </div>

      {sectionError && <p style={{ color: "#ef4444", marginBottom: 12 }}>{sectionError}</p>}
      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? (
        <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>
          Loading…
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          keyField="_id"
          searchFields={["name", "role"]}
          searchPlaceholder="Search team…"
        />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit team member" : "New team member"}>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-field">
              <label className="admin-label">Name</label>
              <input className="admin-input" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="admin-field-error">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="admin-field">
              <label className="admin-label">Role</label>
              <input className="admin-input" {...form.register("role")} />
              {form.formState.errors.role && (
                <p className="admin-field-error">{form.formState.errors.role.message}</p>
              )}
            </div>
            <div className="admin-field">
              <label className="admin-label">Photo URL</label>
              <input className="admin-input" {...form.register("photoUrl")} placeholder="https://…" />
              {form.formState.errors.photoUrl && (
                <p className="admin-field-error">{form.formState.errors.photoUrl.message}</p>
              )}
              <label className="admin-btn admin-btn-ghost" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <Upload size={14} />
                {uploading ? "Uploading…" : "Upload image (WebP)"}
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFile} disabled={uploading} />
              </label>
            </div>
            <div className="admin-field">
              <label className="admin-label">Sort order</label>
              <input className="admin-input" type="number" {...form.register("sortOrder")} />
            </div>
            <div className="admin-field">
              <label className="admin-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Controller
                  name="published"
                  control={form.control}
                  render={({ field: { value, onChange, ref, onBlur } }) => (
                    <input
                      ref={ref}
                      type="checkbox"
                      checked={Boolean(value)}
                      onBlur={onBlur}
                      onChange={(e) => onChange(e.target.checked)}
                    />
                  )}
                />
                Published (visible on About page)
              </label>
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : editing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete team member">
        <p className="admin-confirm-text">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
        </p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </FormModal>
    </>
  );
}
