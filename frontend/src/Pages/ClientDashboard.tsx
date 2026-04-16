import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Helmet } from "react-helmet-async";
import {
  useLoaderData,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from "react-router";

import api, { getApiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getServiceBySlug } from "../data/servicesCatalog";
import type { ClientDashboardLoaderData } from "../lib/clientPortalLoaders";
import styles from "./ClientDashboard.module.css";

type TabId = "overview" | "projects" | "profile";

type ProjectTypeRow = {
  _id: string;
  title: string;
};

type PackageRow = {
  _id: string;
  title: string;
  discount?: number;
  showOnWebsite?: boolean;
  project_type?: (ProjectTypeRow | string)[];
};

function projectTypeIdsFromPackage(pkg: PackageRow): Set<string> {
  const out = new Set<string>();
  for (const pt of pkg.project_type ?? []) {
    const id = typeof pt === "string" ? pt : pt?._id;
    if (id) out.add(String(id));
  }
  return out;
}

function currentStageLabel(
  statusCount: number,
  stages: string[] | undefined,
): string {
  const list = stages ?? [];
  if (list.length === 0) return "—";
  if (statusCount >= list.length) return "Complete";
  return list[statusCount] ?? "—";
}

type ProfileFormState = {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  phone_number: string;
};

const emptyProfileForm: ProfileFormState = {
  first_name: "",
  last_name: "",
  email: "",
  company: "",
  phone_number: "",
};

export default function ClientDashboard() {
  const { serviceRequests, projects } = useLoaderData() as ClientDashboardLoaderData;
  const { user, logout, refresh } = useAuth();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const formRef = useRef<HTMLDivElement | null>(null);

  const [tab, setTab] = useState<TabId>("overview");
  const urlPackageId = searchParams.get("package")?.trim() || "";
  const serviceSlug = searchParams.get("serviceSlug")?.trim() || "";
  const submitted = searchParams.get("submitted") === "1";

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [formPackageId, setFormPackageId] = useState(urlPackageId);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const serviceEntry = serviceSlug ? getServiceBySlug(serviceSlug) : undefined;
  const hasIntent = Boolean(urlPackageId || serviceEntry);

  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const syncProfileFormFromUser = useCallback(() => {
    if (!user) return;
    setProfileForm({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      company: user.company ?? "",
      phone_number: user.phone_number ?? "",
    });
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  }, [user]);

  useEffect(() => {
    if (tab !== "profile") return;
    setProfileMessage(null);
    setProfileError(null);
    void refresh();
  }, [tab, refresh]);

  useEffect(() => {
    if (!profileEditing) syncProfileFormFromUser();
  }, [user, profileEditing, syncProfileFormFromUser]);

  useEffect(() => {
    setFormPackageId(urlPackageId);
  }, [urlPackageId]);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);
    Promise.all([api.get("/package"), api.get("/project-type")])
      .then(([pkgRes, ptRes]) => {
        if (cancelled) return;
        const pkgs = pkgRes.data?.packages;
        const pts = ptRes.data?.projectTypes;
        setPackages(Array.isArray(pkgs) ? pkgs : []);
        setProjectTypes(
          Array.isArray(pts)
            ? [...pts].sort((a: ProjectTypeRow, b: ProjectTypeRow) =>
                (a.title ?? "").localeCompare(b.title ?? ""),
              )
            : [],
        );
      })
      .catch((e) => {
        if (cancelled) return;
        setCatalogError(getApiErrorMessage(e, "Could not load packages or services."));
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const livePackages = useMemo(
    () => packages.filter((p) => p.showOnWebsite !== false),
    [packages],
  );

  /** When a package is chosen, check every project type included in that bundle. */
  useEffect(() => {
    if (!formPackageId) return;
    const pkg = packages.find((p) => p._id === formPackageId);
    if (!pkg) return;
    setSelectedServiceIds([...projectTypeIdsFromPackage(pkg)]);
  }, [formPackageId, packages]);

  const selectedServiceSet = useMemo(
    () => new Set(selectedServiceIds),
    [selectedServiceIds],
  );

  const matchingLivePackages = useMemo(() => {
    if (selectedServiceIds.length === 0) return [];
    return livePackages.filter((pkg) => {
      const pids = projectTypeIdsFromPackage(pkg);
      for (const id of selectedServiceSet) {
        if (!pids.has(id)) return false;
      }
      return true;
    });
  }, [livePackages, selectedServiceIds, selectedServiceSet]);

  const selectedPackageTitle = useMemo(() => {
    if (!formPackageId) return "";
    const p = packages.find((x) => x._id === formPackageId);
    return p?.title?.trim() ?? "";
  }, [formPackageId, packages]);

  const intentHeading = useMemo(() => {
    if (formPackageId && selectedPackageTitle) return `Request: ${selectedPackageTitle}`;
    if (urlPackageId && !formPackageId) return "New service request";
    if (serviceEntry) return `Interest in ${serviceEntry.title}`;
    return "New service request";
  }, [formPackageId, selectedPackageTitle, serviceEntry, urlPackageId]);

  useEffect(() => {
    if (!hasIntent) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasIntent]);

  const clearIntentParams = useCallback(() => {
    setFormPackageId("");
    setSelectedServiceIds([]);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("package");
        next.delete("serviceSlug");
        next.delete("submitted");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const toggleService = useCallback((id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const applyPackageFromHint = useCallback((pkgId: string) => {
    setFormPackageId(pkgId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("package", pkgId);
        next.delete("submitted");
        return next;
      },
      { replace: true },
    );
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [setSearchParams]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    const npw = pwForm.newPassword.trim();
    const cpw = pwForm.confirmPassword.trim();
    const cur = pwForm.currentPassword;
    if (npw || cpw || cur) {
      if (npw !== cpw) {
        setProfileError("New password and confirmation do not match.");
        return;
      }
      if (npw && !cur) {
        setProfileError("Enter your current password to set a new one.");
        return;
      }
    }
    setProfileSaving(true);
    try {
      const userPayload: Record<string, string> = {
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        email: profileForm.email.trim(),
        company: profileForm.company.trim(),
        phone_number: profileForm.phone_number.trim(),
      };
      if (npw) {
        userPayload.currentPassword = cur;
        userPayload.newPassword = npw;
      }
      await api.patch("/auth/me", { user: userPayload });
      await refresh();
      setProfileEditing(false);
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileError(getApiErrorMessage(err, "Could not save profile."));
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    if (!submitted) return;
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("submitted");
          return next;
        },
        { replace: true },
      );
    }, 8000);
    return () => window.clearTimeout(t);
  }, [submitted, setSearchParams]);

  const onSubmitRequest = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!description.trim()) {
      setFormError("Please describe what you need.");
      return;
    }
    if (!meetingDate) {
      setFormError("Please choose a preferred meeting time.");
      return;
    }

    const selectedTitles = projectTypes
      .filter((pt) => selectedServiceSet.has(pt._id))
      .map((pt) => pt.title.trim())
      .filter(Boolean);

    let extraDesc = "";
    if (formPackageId && selectedTitles.length > 0) {
      extraDesc = `\n\nAlso noted services: ${selectedTitles.join(", ")}`;
    }

    const serviceRequest: Record<string, string> = {
      description: description.trim() + extraDesc,
      meeting_date: new Date(meetingDate).toISOString(),
    };

    if (formPackageId) {
      serviceRequest.packageId = formPackageId;
    } else {
      const interestParts: string[] = [];
      if (serviceEntry?.title) interestParts.push(serviceEntry.title);
      interestParts.push(...selectedTitles);
      const unique = [...new Set(interestParts)];
      if (unique.length) {
        serviceRequest.interest =
          unique.length > 1 ? `Services: ${unique.join(" · ")}` : unique[0]!;
      }
    }

    const phone = contactPhone.trim();
    if (phone) serviceRequest.contactPhone = phone;

    setSubmitting(true);
    try {
      await api.post("/system-request", { serviceRequest });
      setDescription("");
      setMeetingDate("");
      setContactPhone("");
      setSelectedServiceIds([]);
      revalidator.revalidate();
      navigate("/dashboard?submitted=1", { replace: true });
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, "Could not send your request. Try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>My dashboard — Xaeon Software Solutions</title>
      </Helmet>

      <div className={styles.page}>
        <h1 className={styles.title}>My dashboard</h1>
        <p className={styles.subtitle}>
          Track open requests and active projects. Submit a package or service
          interest from the site and you&apos;ll land here to finish the details.
        </p>

        <nav className={styles.tabs} aria-label="Dashboard sections">
          {(
            [
              ["overview", "Overview"],
              ["projects", "My projects"],
              ["profile", "Profile"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
              aria-current={tab === id ? "true" : undefined}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <>
            {submitted && (
              <div className={styles.banner} role="status">
                <strong>Request received.</strong> Our team will review it and
                follow up. You can track status below.
                <div className={styles.dismissBtn}>
                  <button
                    type="button"
                    className={`${styles.linkQuiet} ${styles.dismissBtnInner}`}
                    onClick={() => {
                      setSearchParams(
                        (prev) => {
                          const next = new URLSearchParams(prev);
                          next.delete("submitted");
                          return next;
                        },
                        { replace: true },
                      );
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div ref={formRef} className={styles.card}>
              <h2 className={styles.cardTitle}>{intentHeading}</h2>
              {hasIntent ? (
                <p className={`${styles.muted} ${styles.formIntro}`}>
                  Add a short brief and when you&apos;d like to meet. We&apos;ll
                  match this to your account.
                </p>
              ) : (
                <p className={`${styles.muted} ${styles.formIntro}`}>
                  Optionally pick a live package and/or specific services, then
                  describe your goals and schedule a time.
                </p>
              )}
              <form className={styles.formGrid} onSubmit={onSubmitRequest}>
                <div>
                  <label className={styles.label} htmlFor="dash-package">
                    Package <span className={styles.muted}>(optional)</span>
                  </label>
                  {catalogLoading ? (
                    <p className={styles.catalogLoad}>Loading packages…</p>
                  ) : (
                    <select
                      id="dash-package"
                      className={styles.select}
                      value={formPackageId}
                      onChange={(ev) => setFormPackageId(ev.target.value)}
                      aria-describedby="dash-package-hint"
                    >
                      <option value="">No package — services / custom only</option>
                      {livePackages.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                          {typeof p.discount === "number" && p.discount > 0
                            ? ` (${p.discount}% off)`
                            : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  <p id="dash-package-hint" className={`${styles.muted} ${styles.selectHint}`}>
                    Live packages match the public Packages page. Choosing one selects every
                    service in that bundle below—you can still adjust checkboxes.
                  </p>
                </div>

                <fieldset className={styles.checkboxFieldset}>
                  <legend className={styles.checkboxLegend}>
                    Services <span className={styles.muted}>(optional — select any that apply)</span>
                  </legend>
                  {catalogError ? (
                    <p className={styles.error}>{catalogError}</p>
                  ) : catalogLoading ? (
                    <p className={styles.catalogLoad}>Loading services…</p>
                  ) : projectTypes.length === 0 ? (
                    <p className={styles.empty}>No service types are configured yet.</p>
                  ) : (
                    <div className={styles.checkboxList} role="group" aria-label="Service types">
                      {projectTypes.map((pt) => {
                        const id = `dash-svc-${pt._id}`;
                        return (
                          <label key={pt._id} className={styles.checkboxItem} htmlFor={id}>
                            <input
                              id={id}
                              type="checkbox"
                              checked={selectedServiceSet.has(pt._id)}
                              onChange={() => toggleService(pt._id)}
                            />
                            <span>{pt.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>

                {matchingLivePackages.length > 0 && (
                  <div className={styles.packageHint} role="status">
                    <p className={styles.packageHintTitle}>Bundle available</p>
                    <p className={`${styles.muted} ${styles.hintBody}`}>
                      Everything you selected is included in at least one live package.
                      Choosing a package can simplify pricing and delivery.
                    </p>
                    <ul className={styles.packageHintList}>
                      {matchingLivePackages.map((p) => (
                        <li key={p._id}>
                          <strong>{p.title}</strong>
                          {typeof p.discount === "number" && p.discount > 0
                            ? ` — ${p.discount}% off`
                            : ""}
                        </li>
                      ))}
                    </ul>
                    <div className={styles.packageHintActions}>
                      {matchingLivePackages.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          className={styles.hintUsePkgBtn}
                          onClick={() => applyPackageFromHint(p._id)}
                        >
                          Use &quot;{p.title}&quot;
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className={styles.label} htmlFor="dash-desc">
                    Project details
                  </label>
                  <textarea
                    id="dash-desc"
                    className={styles.textarea}
                    value={description}
                    onChange={(ev) => setDescription(ev.target.value)}
                    placeholder="What are you trying to achieve, timeline, and any constraints?"
                    required
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="dash-meeting">
                    Preferred meeting time
                  </label>
                  <input
                    id="dash-meeting"
                    type="datetime-local"
                    className={styles.input}
                    value={meetingDate}
                    onChange={(ev) => setMeetingDate(ev.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="dash-phone">
                    Phone <span className={styles.muted}>(optional)</span>
                  </label>
                  <input
                    id="dash-phone"
                    type="tel"
                    className={styles.input}
                    value={contactPhone}
                    onChange={(ev) => setContactPhone(ev.target.value)}
                    autoComplete="tel"
                  />
                </div>
                {formError ? <p className={styles.error}>{formError}</p> : null}
                <div className={styles.submitRow}>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={submitting}
                  >
                    {submitting ? "Sending…" : "Submit request"}
                  </button>
                  {hasIntent ? (
                    <button
                      type="button"
                      className={`${styles.linkQuiet} ${styles.clearContextBtn}`}
                      onClick={clearIntentParams}
                    >
                      Clear package / service context
                    </button>
                  ) : null}
                </div>
              </form>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Your requests</h2>
              {serviceRequests.length === 0 ? (
                <p className={styles.empty}>No requests yet.</p>
              ) : (
                <ul className={styles.list}>
                  {serviceRequests.map((r) => (
                    <li key={r._id} className={styles.listItem}>
                      <p className={styles.listItemTitle}>{r.title}</p>
                      <p className={styles.listItemMeta}>
                        Submitted{" "}
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                        {r.package?.title ? ` · ${r.package.title}` : null}
                        {r.interest && !r.package?.title ? ` · ${r.interest}` : null}
                      </p>
                      <span className={styles.statusPill}>{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {tab === "projects" && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Active projects</h2>
            {projects.length === 0 ? (
              <p className={styles.empty}>
                When we assign a project to your account, it will appear here with
                its current stage.
              </p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Project</th>
                      <th scope="col">Type</th>
                      <th scope="col">Stage</th>
                      <th scope="col">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p._id}>
                        <td className={styles.projectTitleCell}>{p.title}</td>
                        <td>{p.project_type?.title ?? "—"}</td>
                        <td>
                          {currentStageLabel(
                            p.status_count,
                            p.project_type?.stages,
                          )}
                        </td>
                        <td>
                          {p.deadline
                            ? new Date(p.deadline).toLocaleDateString(undefined, {
                                dateStyle: "medium",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className={styles.card}>
            <div className={styles.profileHeaderRow}>
              <h2 className={`${styles.cardTitle} ${styles.profileCardTitle}`}>Account</h2>
              {!profileEditing ? (
                <button
                  type="button"
                  className={styles.profileEditBtn}
                  onClick={() => {
                    setProfileError(null);
                    setProfileMessage(null);
                    syncProfileFormFromUser();
                    setProfileEditing(true);
                  }}
                >
                  Edit profile
                </button>
              ) : null}
            </div>

            {profileMessage ? (
              <p className={styles.profileSuccess} role="status">
                {profileMessage}
              </p>
            ) : null}
            {profileError ? <p className={styles.error}>{profileError}</p> : null}

            {!profileEditing ? (
              <>
                <div className={styles.profileGrid}>
                  <div className={styles.profileRow}>
                    <span className={styles.label}>Name</span>
                    <p className={styles.profileValue}>{user?.name ?? "—"}</p>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.label}>Email</span>
                    <p className={styles.profileValue}>{user?.email ?? "—"}</p>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.label}>Phone</span>
                    <p className={styles.profileValue}>
                      {user?.phone_number?.trim() ? user.phone_number : "—"}
                    </p>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.label}>Company</span>
                    <p className={styles.profileValue}>
                      {user?.company?.trim() ? user.company : "—"}
                    </p>
                  </div>
                </div>
                <div className={`${styles.submitRow} ${styles.profileActions}`}>
                  <button type="button" className={styles.submitBtn} onClick={() => logout()}>
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <form className={styles.profileForm} onSubmit={saveProfile}>
                <div className={styles.profileFormGrid}>
                  <div className={styles.profileField}>
                    <label className={styles.label} htmlFor="prof-fn">
                      First name
                    </label>
                    <input
                      id="prof-fn"
                      className={styles.input}
                      value={profileForm.first_name}
                      onChange={(ev) =>
                        setProfileForm((f) => ({ ...f, first_name: ev.target.value }))
                      }
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div className={styles.profileField}>
                    <label className={styles.label} htmlFor="prof-ln">
                      Last name
                    </label>
                    <input
                      id="prof-ln"
                      className={styles.input}
                      value={profileForm.last_name}
                      onChange={(ev) =>
                        setProfileForm((f) => ({ ...f, last_name: ev.target.value }))
                      }
                      required
                      autoComplete="family-name"
                    />
                  </div>
                  <div className={`${styles.profileField} ${styles.profileFieldFull}`}>
                    <label className={styles.label} htmlFor="prof-email">
                      Email
                    </label>
                    <input
                      id="prof-email"
                      type="email"
                      className={styles.input}
                      value={profileForm.email}
                      onChange={(ev) =>
                        setProfileForm((f) => ({ ...f, email: ev.target.value }))
                      }
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className={`${styles.profileField} ${styles.profileFieldFull}`}>
                    <label className={styles.label} htmlFor="prof-phone">
                      Phone
                    </label>
                    <input
                      id="prof-phone"
                      type="tel"
                      className={styles.input}
                      value={profileForm.phone_number}
                      onChange={(ev) =>
                        setProfileForm((f) => ({ ...f, phone_number: ev.target.value }))
                      }
                      required
                      autoComplete="tel"
                    />
                  </div>
                  <div className={`${styles.profileField} ${styles.profileFieldFull}`}>
                    <label className={styles.label} htmlFor="prof-co">
                      Company <span className={styles.muted}>(optional)</span>
                    </label>
                    <input
                      id="prof-co"
                      className={styles.input}
                      value={profileForm.company}
                      onChange={(ev) =>
                        setProfileForm((f) => ({ ...f, company: ev.target.value }))
                      }
                      autoComplete="organization"
                    />
                  </div>
                </div>

                <div className={styles.profilePasswordSection}>
                  <h3 className={styles.profilePasswordTitle}>Change password</h3>
                  <p className={`${styles.muted} ${styles.hintBody}`}>
                    Leave blank to keep your current password.
                  </p>
                  <div className={styles.profileFormGrid}>
                    <div className={`${styles.profileField} ${styles.profileFieldFull}`}>
                      <label className={styles.label} htmlFor="prof-cur-pw">
                        Current password
                      </label>
                      <input
                        id="prof-cur-pw"
                        type="password"
                        className={styles.input}
                        value={pwForm.currentPassword}
                        onChange={(ev) =>
                          setPwForm((p) => ({ ...p, currentPassword: ev.target.value }))
                        }
                        autoComplete="current-password"
                      />
                    </div>
                    <div className={styles.profileField}>
                      <label className={styles.label} htmlFor="prof-new-pw">
                        New password
                      </label>
                      <input
                        id="prof-new-pw"
                        type="password"
                        className={styles.input}
                        value={pwForm.newPassword}
                        onChange={(ev) =>
                          setPwForm((p) => ({ ...p, newPassword: ev.target.value }))
                        }
                        autoComplete="new-password"
                        minLength={6}
                      />
                    </div>
                    <div className={styles.profileField}>
                      <label className={styles.label} htmlFor="prof-confirm-pw">
                        Confirm new password
                      </label>
                      <input
                        id="prof-confirm-pw"
                        type="password"
                        className={styles.input}
                        value={pwForm.confirmPassword}
                        onChange={(ev) =>
                          setPwForm((p) => ({ ...p, confirmPassword: ev.target.value }))
                        }
                        autoComplete="new-password"
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className={`${styles.submitRow} ${styles.profileActions}`}>
                  <button
                    type="button"
                    className={styles.profileCancelBtn}
                    disabled={profileSaving}
                    onClick={() => {
                      setProfileEditing(false);
                      setProfileError(null);
                      syncProfileFormFromUser();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={profileSaving}>
                    {profileSaving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    className={styles.profileLogoutOutline}
                    disabled={profileSaving}
                    onClick={() => logout()}
                  >
                    Log out
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
