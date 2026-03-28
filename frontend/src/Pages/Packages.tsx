import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Check } from "lucide-react";

import api from "../lib/api";
import styles from "./Packages.module.css";

type ProjectType = {
  _id: string;
  title: string;
  stages?: string[];
};

type PackageEntry = {
  _id: string;
  title: string;
  discount: number;
  project_type: ProjectType[];
};

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
  const [packages, setPackages] = useState<PackageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const topPackages = useMemo(() => packages.slice(0, 4), [packages]);

  const compareRows = useMemo(() => {
    const byId = new Map<string, ProjectType>();
    for (const p of topPackages) {
      for (const pt of p.project_type ?? []) {
        if (pt?._id) byId.set(pt._id, pt);
      }
    }
    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [topPackages]);

  const scrollToPlans = useCallback(() => {
    const el = document.getElementById("plans");
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  return (
    <>
      <Helmet>
        <title>Packages — Xaeon Software Solutions</title>
        <meta
          name="description"
          content="Compare packages and choose the plan that fits your goals."
        />
      </Helmet>

      <section className={styles.hero} aria-label="Packages">
        {reducedMotion ? (
          <div className={styles.heroStaticBg} aria-hidden />
        ) : (
          <video
            className={styles.heroVideo}
            src="/assets/videos/heropackages.mp4"
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
          ) : topPackages.length === 0 ? (
            <div className={styles.state}>No packages available yet.</div>
          ) : (
            <>
              <div className={styles.cardRow} aria-label="Plan cards">
                {topPackages.map((p) => (
                  <article key={p._id} className={styles.card}>
                    <header className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}>{p.title}</h2>
                      <div className={styles.cardSub}>
                        {p.discount > 0 ? (
                          <span className={styles.discount}>
                            Save {p.discount}%
                          </span>
                        ) : (
                          <span className={styles.discountMuted}>
                            No discount
                          </span>
                        )}
                      </div>
                    </header>

                    <ul className={styles.cardList}>
                      {(p.project_type ?? []).slice(0, 8).map((pt) => (
                        <li key={pt._id} className={styles.cardListItem}>
                          <span className={styles.bullet} aria-hidden>
                            •
                          </span>
                          <span className={styles.cardListText}>{pt.title}</span>
                        </li>
                      ))}
                      {(p.project_type ?? []).length > 8 ? (
                        <li className={styles.cardListItemMuted}>
                          +{(p.project_type ?? []).length - 8} more
                        </li>
                      ) : null}
                    </ul>

                    <button
                      type="button"
                      className={styles.cardCta}
                      onClick={scrollToPlans}
                    >
                      Get Started
                    </button>
                  </article>
                ))}
              </div>

              <div className={styles.compare}>
                <h2 className={styles.compareTitle}>Compare Plans</h2>
                <p className={styles.compareSubtitle}>
                  Choose the plan that fits you best
                </p>

                <div className={styles.tableWrap} role="region" aria-label="Compare plans table" tabIndex={0}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col" className={styles.thLeft}>
                          Service / Package
                        </th>
                        {topPackages.map((p) => (
                          <th key={p._id} scope="col" className={styles.th}>
                            {p.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {compareRows.map((row) => (
                        <tr key={row._id}>
                          <th scope="row" className={styles.tdLeft}>
                            {row.title}
                          </th>
                          {topPackages.map((p) => {
                            const has = (p.project_type ?? []).some(
                              (pt) => pt._id === row._id
                            );
                            return (
                              <td key={p._id} className={styles.td}>
                                {has ? (
                                  <span className={styles.check} aria-label="Included">
                                    <Check className={styles.checkIcon} aria-hidden />
                                  </span>
                                ) : (
                                  <span className={styles.dash} aria-hidden>
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default Packages;
