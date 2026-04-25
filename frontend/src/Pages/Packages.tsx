import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  Code2,
  Globe,
  Layers,
  LayoutDashboard,
  Megaphone,
  Palette,
  Smartphone,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";

import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PackageEnquiryModal from "../Components/Packages/PackageEnquiryModal";
import Seo from "../seo/Seo";
import styles from "./Packages.module.css";

type ProjectType = {
  _id: string;
  title: string;
  stages?: string[];
};

type PackageEntry = {
  _id: string;
  title: string;
  description?: string;
  discount: number;
  showOnWebsite?: boolean;
  sortOrder?: number;
  project_type: ProjectType[];
};

const CARD_ACCENTS = [
  styles.planCardAccent0,
  styles.planCardAccent1,
  styles.planCardAccent2,
  styles.planCardAccent3,
] as const;

function serviceIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes("website") && !t.includes("web app")) return Globe;
  if (t.includes("web app")) return LayoutDashboard;
  if (t.includes("mobile")) return Smartphone;
  if (t.includes("design") || t.includes("brand")) return Palette;
  if (t.includes("video") || t.includes("photograph")) return Video;
  if (t.includes("market")) return Megaphone;
  if (t.includes("ai")) return Sparkles;
  if (t.includes("custom")) return Code2;
  return Layers;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

const Packages = () => {
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [packages, setPackages] = useState<PackageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enquiryPackage, setEnquiryPackage] = useState<PackageEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get("/package")
      .then((res) => {
        const list = (res.data?.packages ?? []) as PackageEntry[];
        if (cancelled) return;
        setPackages(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "Failed to load packages. Try again."
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Plans shown to visitors — `showOnWebsite: false` stays in admin only. */
  const visiblePackages = useMemo(() => {
    const shown = packages.filter((p) => p.showOnWebsite !== false);
    return [...shown].sort((a, b) => {
      const oa = a.sortOrder ?? 0;
      const ob = b.sortOrder ?? 0;
      if (oa !== ob) return oa - ob;
      return a.title.localeCompare(b.title);
    });
  }, [packages]);

  const compareRows = useMemo(() => {
    const byId = new Map<string, ProjectType>();
    for (const p of visiblePackages) {
      for (const pt of p.project_type ?? []) {
        if (pt?._id) byId.set(pt._id, pt);
      }
    }
    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [visiblePackages]);

  const scrollToPlans = useCallback(() => {
    const el = document.getElementById("plans");
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  const handleBookPackage = useCallback(
    (p: PackageEntry) => {
      if (authLoading) return;
      if (user) {
        navigate(`/dashboard?package=${encodeURIComponent(p._id)}`);
      } else {
        setEnquiryPackage(p);
      }
    },
    [authLoading, user, navigate],
  );

  return (
    <>
      <Seo
        title="Packages — Xaeon Software Solutions"
        description="Compare packages and choose the plan that fits your goals. Clear deliverables, transparent stages, and a discount built in."
        pathname="/packages"
      />

      <section className={styles.hero} aria-label="Packages">
        {reducedMotion ? (
          <div className={styles.heroStaticBg} aria-hidden />
        ) : (
          <video
            className={styles.heroVideo}
            src="/assets/videos/heropackages.webm"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
          />
        )}
        <div className={styles.heroOverlay} aria-hidden />

        <div className={styles.heroContent}>
          <div className={styles.heroPill}>Simple Plan, No Hidden Costs</div>
          <h1 className={styles.heroHeadline}>Find Your Perfect Plan</h1>
          <button type="button" className={styles.heroCta} onClick={scrollToPlans}>
            Get Started
          </button>
        </div>
      </section>

      <section className={styles.section} id="plans" aria-label="Plans">
        <div className={styles.sectionInner}>
          {loading ? (
            <div className={styles.state}>Loading packages…</div>
          ) : error ? (
            <div className={styles.stateError}>{error}</div>
          ) : packages.length === 0 ? (
            <div className={styles.state}>No packages available yet.</div>
          ) : visiblePackages.length === 0 ? (
            <div className={styles.state}>
              No packages are enabled for the website. Your team can turn on{" "}
              <strong>Show on website</strong> in admin for the plans you want to promote.
            </div>
          ) : (
            <>
              <p className={styles.planIntro}>
                Pick a bundle — each one is built from our core services with a clear discount. We keep this list focused so choosing a path stays simple.
              </p>

              <div className={styles.planGrid} aria-label="Plan cards">
                {visiblePackages.map((p, index) => {
                  const services = p.project_type ?? [];
                  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
                  const pitch = (p.description ?? "").trim();

                  return (
                    <article
                      key={p._id}
                      className={`${styles.planCard} ${accent}`}
                    >
                      <div className={styles.planCardSheen} aria-hidden />

                      <div className={styles.planCardIconRow} aria-hidden>
                        {services.slice(0, 5).map((pt) => {
                          const Icon = serviceIcon(pt.title);
                          return (
                            <span
                              key={pt._id}
                              className={styles.planIconSlot}
                              title={pt.title}
                            >
                              <Icon className={styles.planIcon} strokeWidth={1.65} />
                            </span>
                          );
                        })}
                        {services.length > 5 ? (
                          <span className={styles.planIconMore}>
                            +{services.length - 5}
                          </span>
                        ) : null}
                      </div>

                      <div className={styles.planCardHead}>
                        <h2 className={styles.planCardTitle}>{p.title}</h2>
                        {p.discount > 0 ? (
                          <span className={styles.planSavePill}>
                            Save {p.discount}%
                          </span>
                        ) : (
                          <span className={styles.planSaveMuted}>Custom</span>
                        )}
                      </div>

                      <p className={pitch ? styles.planPitch : styles.planPitchMuted}>
                        {pitch ||
                          "Add a short public description for this package in admin — it appears only here, so each bundle can sound unique."}
                      </p>

                      <ul className={styles.planChipList}>
                        {services.map((pt) => {
                          const Icon = serviceIcon(pt.title);
                          return (
                            <li key={pt._id} className={styles.planChip}>
                              <span className={styles.planChipIconWrap}>
                                <Icon
                                  className={styles.planChipIcon}
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </span>
                              <span className={styles.planChipLabel}>{pt.title}</span>
                            </li>
                          );
                        })}
                      </ul>

                      <button
                        type="button"
                        className={styles.planCta}
                        onClick={() => handleBookPackage(p)}
                      >
                        <span>Get started</span>
                        <Zap className={styles.planCtaIcon} strokeWidth={2.2} aria-hidden />
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className={styles.compare}>
                <h2 className={styles.compareTitle}>Compare Plans</h2>
                <p className={styles.compareSubtitle}>
                  Savings, coverage, and what&apos;s included — all in one view. On small screens, each plan opens below.
                </p>

                {/* Desktop & tablet: fluid table — no horizontal scroll */}
                <div
                  className={styles.compareTableWrap}
                  role="region"
                  aria-label="Compare packages"
                >
                  <table className={styles.compareTable}>
                    <colgroup>
                      <col className={styles.compareColFeature} />
                      {visiblePackages.map((p) => (
                        <col key={p._id} className={styles.compareColPlan} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th scope="col" className={styles.compareThCorner}>
                          Plan
                        </th>
                        {visiblePackages.map((p) => (
                          <th
                            key={p._id}
                            scope="col"
                            className={styles.compareThPlan}
                            title={p.title}
                          >
                            <span className={styles.compareThPlanName}>{p.title}</span>
                            <span
                              className={
                                p.discount > 0
                                  ? styles.compareThPlanDiscount
                                  : styles.compareThPlanDiscountMuted
                              }
                            >
                              {p.discount > 0
                                ? `Save ${p.discount}%`
                                : "No bundle off"}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={styles.compareTrMeta}>
                        <th scope="row" className={styles.compareRowLabel}>
                          Bundle savings
                        </th>
                        {visiblePackages.map((p) => (
                          <td key={p._id} className={styles.compareTdMeta}>
                            {p.discount > 0 ? (
                              <span className={styles.compareMetaHighlight}>
                                {p.discount}%
                              </span>
                            ) : (
                              <span className={styles.compareMetaDash}>—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr className={styles.compareTrMeta}>
                        <th scope="row" className={styles.compareRowLabel}>
                          Services in bundle
                        </th>
                        {visiblePackages.map((p) => (
                          <td key={p._id} className={styles.compareTdMeta}>
                            <span className={styles.compareMetaHighlight}>
                              {(p.project_type ?? []).length}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className={styles.compareTrSection}>
                        <td
                          colSpan={visiblePackages.length + 1}
                          className={styles.compareSectionCell}
                        >
                          Service coverage
                        </td>
                      </tr>
                      {compareRows.map((row) => (
                        <tr key={row._id} className={styles.compareTrService}>
                          <th scope="row" className={styles.compareServiceName}>
                            {row.title}
                          </th>
                          {visiblePackages.map((p) => {
                            const has = (p.project_type ?? []).some(
                              (pt) => String(pt._id) === String(row._id)
                            );
                            return (
                              <td key={p._id} className={styles.compareTdCheck}>
                                {has ? (
                                  <span
                                    className={styles.check}
                                    aria-label={`${p.title} includes ${row.title}`}
                                  >
                                    <Check className={styles.checkIcon} aria-hidden />
                                  </span>
                                ) : (
                                  <span
                                    className={styles.dash}
                                    aria-label={`${p.title} does not include ${row.title}`}
                                  >
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className={styles.compareTrFoot}>
                        <th scope="row" className={styles.compareFootLabel}>
                          Ready to start?
                        </th>
                        {visiblePackages.map((p) => (
                          <td key={p._id} className={styles.compareTdFoot}>
                            <button
                              type="button"
                              className={styles.compareFootLink}
                              onClick={() => handleBookPackage(p)}
                            >
                              Book
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile: one card per package — no horizontal scroll */}
                <div
                  className={styles.compareMobile}
                  aria-label="Compare packages by plan"
                >
                  {visiblePackages.map((p) => (
                    <article key={p._id} className={styles.compareMobileCard}>
                      <header className={styles.compareMobileHead}>
                        <h3 className={styles.compareMobileTitle}>{p.title}</h3>
                        <div className={styles.compareMobileBadges}>
                          {p.discount > 0 ? (
                            <span className={styles.compareMobileSave}>
                              Save {p.discount}%
                            </span>
                          ) : null}
                          <span className={styles.compareMobileCount}>
                            {(p.project_type ?? []).length} service
                            {(p.project_type ?? []).length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </header>
                      <ul className={styles.compareMobileList}>
                        {compareRows.map((row) => {
                          const has = (p.project_type ?? []).some(
                            (pt) => String(pt._id) === String(row._id)
                          );
                          return (
                            <li
                              key={row._id}
                              className={
                                has
                                  ? styles.compareMobileRowIn
                                  : styles.compareMobileRowOut
                              }
                            >
                              {has ? (
                                <Check
                                  className={styles.compareMobileCheck}
                                  strokeWidth={2.5}
                                  aria-hidden
                                />
                              ) : (
                                <span className={styles.compareMobileNo} aria-hidden>
                                  —
                                </span>
                              )}
                              <span className={styles.compareMobileSvc}>
                                {row.title}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <button
                        type="button"
                        className={styles.compareMobileCta}
                        onClick={() => handleBookPackage(p)}
                      >
                        Get started
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {enquiryPackage ? (
        <PackageEnquiryModal
          open
          onClose={() => setEnquiryPackage(null)}
          packageId={enquiryPackage._id}
          packageTitle={enquiryPackage.title}
        />
      ) : null}
    </>
  );
};

export default Packages;
