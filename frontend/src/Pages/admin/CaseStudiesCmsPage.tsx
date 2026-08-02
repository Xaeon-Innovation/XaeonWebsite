import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { Controller, useFieldArray, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { uploadSiteAsset } from "../../lib/siteUpload";
import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";

type CaseStudyStat = { value: string; label: string };

type CaseStudyRow = {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  logoUrl?: string;
  slug?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  introText?: string;
  showcaseImageUrls?: string[];
  dashboardImageUrl?: string;
  narrativeBefore?: string;
  lifestyleImageUrl?: string;
  narrativeAfter?: string;
  stats?: CaseStudyStat[];
  exploreHref?: string;
  exploreLabel?: string;
  sortOrder: number;
  published: boolean;
};

const sortOrderSchema = z.preprocess((v) => {
  if (v === "" || v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}, z.number().int());

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((s) => !s || URL.canParse(s), "Invalid URL");

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const schema = z.object({
  title: z.string().trim().min(1, "Required"),
  subtitle: z.string().trim().min(1, "Required"),
  description: z.string().trim().min(1, "Required"),
  imageUrl: z.string().trim().min(1, "Required").refine((s) => URL.canParse(s), "Invalid image URL"),
  logoUrl: optionalUrl,
  slug: z
    .string()
    .trim()
    .min(1, "Required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens"),
  heroTitle: z.string().trim().optional(),
  heroSubtitle: z.string().trim().optional(),
  heroImageUrl: optionalUrl,
  introText: z.string().trim().optional(),
  showcaseImageUrls: z.array(z.string().trim().refine((s) => URL.canParse(s), "Invalid URL")).default([]),
  dashboardImageUrl: optionalUrl,
  narrativeBefore: z.string().trim().optional(),
  lifestyleImageUrl: optionalUrl,
  narrativeAfter: z.string().trim().optional(),
  stats: z
    .array(
      z.object({
        value: z.string().trim().min(1, "Required"),
        label: z.string().trim().min(1, "Required"),
      })
    )
    .default([]),
  exploreHref: z.string().trim().optional(),
  exploreLabel: z.string().trim().optional(),
  sortOrder: sortOrderSchema,
  published: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const emptyDefaults: FormValues = {
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  logoUrl: "",
  slug: "",
  heroTitle: "",
  heroSubtitle: "",
  heroImageUrl: "",
  introText: "",
  showcaseImageUrls: [],
  dashboardImageUrl: "",
  narrativeBefore: "",
  lifestyleImageUrl: "",
  narrativeAfter: "",
  stats: [],
  exploreHref: "",
  exploreLabel: "",
  sortOrder: 0,
  published: false,
};

type UploadSlot =
  | "case"
  | "logo"
  | "hero"
  | "dashboard"
  | "lifestyle"
  | "showcase";

function UploadButton({
  label,
  busy,
  disabled,
  onFile,
  accept = "image/jpeg,image/png,image/webp",
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onFile: (file: File) => void;
  accept?: string;
}) {
  return (
    <label
      className="admin-btn admin-btn-ghost"
      style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
    >
      <Upload size={14} />
      {busy ? "Uploading…" : label}
      <input
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<CaseStudyRow>(
    "/case-study",
    "caseStudies",
    "caseStudy"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CaseStudyRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CaseStudyRow | null>(null);
  const [uploading, setUploading] = useState<UploadSlot | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    mode: "onBlur",
    defaultValues: emptyDefaults,
  });

  const statsArray = useFieldArray({ control: form.control, name: "stats" });
  const showcaseUrls = form.watch("showcaseImageUrls") ?? [];

  const runUpload = async (slot: UploadSlot, file: File, apply: (url: string) => void) => {
    setUploading(slot);
    try {
      const url = await uploadSiteAsset(file, slot === "logo" ? "logo" : "case");
      apply(url);
    } finally {
      setUploading(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setSlugTouched(false);
    form.reset({
      ...emptyDefaults,
      sortOrder: data.length,
      published: true,
    });
    setModalOpen(true);
  };

  const openEdit = (row: CaseStudyRow) => {
    setEditing(row);
    setSlugTouched(true);
    form.reset({
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      imageUrl: row.imageUrl,
      logoUrl: row.logoUrl ?? "",
      slug: row.slug ?? slugify(row.title),
      heroTitle: row.heroTitle ?? "",
      heroSubtitle: row.heroSubtitle ?? "",
      heroImageUrl: row.heroImageUrl ?? "",
      introText: row.introText ?? "",
      showcaseImageUrls: row.showcaseImageUrls ?? [],
      dashboardImageUrl: row.dashboardImageUrl ?? "",
      narrativeBefore: row.narrativeBefore ?? "",
      lifestyleImageUrl: row.lifestyleImageUrl ?? "",
      narrativeAfter: row.narrativeAfter ?? "",
      stats: row.stats ?? [],
      exploreHref: row.exploreHref ?? "",
      exploreLabel: row.exploreLabel ?? "",
      sortOrder: row.sortOrder ?? 0,
      published: row.published ?? false,
    });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        title: values.title,
        subtitle: values.subtitle,
        description: values.description,
        imageUrl: values.imageUrl,
        logoUrl: values.logoUrl?.trim() || "",
        slug: values.slug,
        heroTitle: values.heroTitle?.trim() || "",
        heroSubtitle: values.heroSubtitle?.trim() || "",
        heroImageUrl: values.heroImageUrl?.trim() || "",
        introText: values.introText?.trim() || "",
        showcaseImageUrls: values.showcaseImageUrls ?? [],
        dashboardImageUrl: values.dashboardImageUrl?.trim() || "",
        narrativeBefore: values.narrativeBefore?.trim() || "",
        lifestyleImageUrl: values.lifestyleImageUrl?.trim() || "",
        narrativeAfter: values.narrativeAfter?.trim() || "",
        stats: values.stats ?? [],
        exploreHref: values.exploreHref?.trim() || "",
        exploreLabel: values.exploreLabel?.trim() || "",
        sortOrder: values.sortOrder,
        published: values.published,
      };
      if (editing) {
        await update({ id: editing._id, ...payload });
      } else {
        await create(payload);
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

  const columns: Column<CaseStudyRow>[] = [
    { header: "Title", accessor: "title", sortable: true },
    {
      header: "Slug",
      accessor: "slug",
      render: (v) => (typeof v === "string" && v ? v : "—"),
    },
    {
      header: "Image",
      accessor: "imageUrl",
      render: (v) =>
        typeof v === "string" && v ? (
          <img src={v} alt="" style={{ width: 56, height: 36, objectFit: "cover", borderRadius: 6 }} />
        ) : (
          "—"
        ),
    },
    { header: "Order", accessor: "sortOrder", sortable: true },
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
        <title>Case studies (Our Work) — Xaeon Admin</title>
      </Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Our Work — Case studies</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add case study
        </button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? (
        <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          keyField="_id"
          searchFields={["title", "subtitle", "slug"]}
          searchPlaceholder="Search case studies…"
        />
      )}

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit case study" : "New case study"}
        wide
      >
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <p className="admin-form-section-title" style={{ border: 0, padding: 0, margin: 0 }}>
              Carousel card
            </p>
            <p className="admin-hint">
              Shown on Our Work. Explore links to <code>/case-studies/&#123;slug&#125;</code> unless overridden.
            </p>

            <div className="admin-field">
              <label className="admin-label">Title</label>
              <input
                className="admin-input"
                {...form.register("title", {
                  onChange: (e) => {
                    if (!slugTouched) {
                      form.setValue("slug", slugify(e.target.value), { shouldValidate: true });
                    }
                  },
                })}
              />
              {form.formState.errors.title && (
                <p className="admin-field-error">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="admin-field">
              <label className="admin-label">Slug (URL)</label>
              <input
                className="admin-input"
                {...form.register("slug", {
                  onChange: () => setSlugTouched(true),
                })}
                placeholder="creative-multi-solutions"
              />
              {form.formState.errors.slug && (
                <p className="admin-field-error">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="admin-field">
              <label className="admin-label">Subtitle</label>
              <input className="admin-input" {...form.register("subtitle")} />
            </div>

            <div className="admin-field">
              <label className="admin-label">Description</label>
              <textarea className="admin-textarea" rows={3} {...form.register("description")} />
            </div>

            <div className="admin-field">
              <label className="admin-label">Case image URL</label>
              <input className="admin-input" {...form.register("imageUrl")} />
              {form.formState.errors.imageUrl && (
                <p className="admin-field-error">{form.formState.errors.imageUrl.message}</p>
              )}
              <UploadButton
                label="Upload (WebP)"
                busy={uploading === "case"}
                disabled={uploading !== null}
                onFile={(file) =>
                  runUpload("case", file, (url) => form.setValue("imageUrl", url, { shouldValidate: true }))
                }
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Client logo URL (optional)</label>
              <input className="admin-input" {...form.register("logoUrl")} placeholder="WebP or SVG" />
              {form.formState.errors.logoUrl && (
                <p className="admin-field-error">{String(form.formState.errors.logoUrl.message)}</p>
              )}
              <UploadButton
                label="Upload logo (WebP or SVG)"
                busy={uploading === "logo"}
                disabled={uploading !== null}
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onFile={(file) =>
                  runUpload("logo", file, (url) => form.setValue("logoUrl", url, { shouldValidate: true }))
                }
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Explore link override (optional)</label>
              <input
                className="admin-input"
                {...form.register("exploreHref")}
                placeholder="Leave empty for /case-studies/{slug}"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Explore label (optional)</label>
              <input className="admin-input" {...form.register("exploreLabel")} placeholder="Explore" />
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
                Published (visible on Our Work)
              </label>
            </div>

            <div className="admin-form-section">
              <h3 className="admin-form-section-title">Detail page</h3>
              <p className="admin-hint">Optional fields; empty sections are hidden on the public page.</p>

              <div className="admin-field">
                <label className="admin-label">Hero title</label>
                <input className="admin-input" {...form.register("heroTitle")} placeholder="Defaults to card title" />
              </div>
              <div className="admin-field">
                <label className="admin-label">Hero subtitle</label>
                <input
                  className="admin-input"
                  {...form.register("heroSubtitle")}
                  placeholder="Defaults to card description"
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Hero image URL</label>
                <input
                  className="admin-input"
                  {...form.register("heroImageUrl")}
                  placeholder="Defaults to case image"
                />
                {form.formState.errors.heroImageUrl && (
                  <p className="admin-field-error">{String(form.formState.errors.heroImageUrl.message)}</p>
                )}
                <UploadButton
                  label="Upload hero image"
                  busy={uploading === "hero"}
                  disabled={uploading !== null}
                  onFile={(file) =>
                    runUpload("hero", file, (url) =>
                      form.setValue("heroImageUrl", url, { shouldValidate: true })
                    )
                  }
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Intro text</label>
                <textarea className="admin-textarea" rows={4} {...form.register("introText")} />
              </div>

              <div className="admin-field">
                <label className="admin-label">Showcase images</label>
                <p className="admin-hint">Collage on the left of the showcase section.</p>
                {showcaseUrls.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    {showcaseUrls.map((url, i) => (
                      <div key={`${url}-${i}`} style={{ position: "relative" }}>
                        <img
                          src={url}
                          alt=""
                          style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 6 }}
                        />
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            padding: 2,
                            borderRadius: 999,
                          }}
                          aria-label="Remove image"
                          onClick={() => {
                            const next = showcaseUrls.filter((_, idx) => idx !== i);
                            form.setValue("showcaseImageUrls", next, { shouldValidate: true });
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <UploadButton
                  label="Add showcase image"
                  busy={uploading === "showcase"}
                  disabled={uploading !== null}
                  onFile={(file) =>
                    runUpload("showcase", file, (url) => {
                      form.setValue("showcaseImageUrls", [...showcaseUrls, url], {
                        shouldValidate: true,
                      });
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Dashboard image URL</label>
                <input className="admin-input" {...form.register("dashboardImageUrl")} />
                {form.formState.errors.dashboardImageUrl && (
                  <p className="admin-field-error">
                    {String(form.formState.errors.dashboardImageUrl.message)}
                  </p>
                )}
                <UploadButton
                  label="Upload dashboard image"
                  busy={uploading === "dashboard"}
                  disabled={uploading !== null}
                  onFile={(file) =>
                    runUpload("dashboard", file, (url) =>
                      form.setValue("dashboardImageUrl", url, { shouldValidate: true })
                    )
                  }
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Narrative (before lifestyle photo)</label>
                <textarea className="admin-textarea" rows={4} {...form.register("narrativeBefore")} />
              </div>

              <div className="admin-field">
                <label className="admin-label">Lifestyle image URL</label>
                <input className="admin-input" {...form.register("lifestyleImageUrl")} />
                {form.formState.errors.lifestyleImageUrl && (
                  <p className="admin-field-error">
                    {String(form.formState.errors.lifestyleImageUrl.message)}
                  </p>
                )}
                <UploadButton
                  label="Upload lifestyle image"
                  busy={uploading === "lifestyle"}
                  disabled={uploading !== null}
                  onFile={(file) =>
                    runUpload("lifestyle", file, (url) =>
                      form.setValue("lifestyleImageUrl", url, { shouldValidate: true })
                    )
                  }
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Narrative (after lifestyle photo)</label>
                <textarea className="admin-textarea" rows={4} {...form.register("narrativeAfter")} />
              </div>
            </div>

            <div className="admin-form-section">
              <h3 className="admin-form-section-title">Results / stats</h3>
              <p className="admin-hint">Optional. Section only appears when at least one row is saved.</p>

              {statsArray.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="admin-form-row"
                  style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, alignItems: "start" }}
                >
                  <div className="admin-field">
                    <label className="admin-label">Value</label>
                    <input className="admin-input" {...form.register(`stats.${index}.value`)} placeholder="24.2%" />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">Label</label>
                    <input
                      className="admin-input"
                      {...form.register(`stats.${index}.label`)}
                      placeholder="increase in referring domains"
                    />
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost"
                    style={{ marginTop: 22 }}
                    onClick={() => statsArray.remove(index)}
                    aria-label="Remove stat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => statsArray.append({ value: "", label: "" })}
              >
                <Plus size={14} /> Add stat
              </button>
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

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete case study">
        <p className="admin-confirm-text">
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
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
