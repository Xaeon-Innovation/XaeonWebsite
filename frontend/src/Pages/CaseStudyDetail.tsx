import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import CallToAction from "../Components/CallToAction/CallToAction";
import api from "../lib/api";
import Seo from "../seo/Seo";
import { caseStudyJsonLd } from "../seo/schema";
import styles from "./CaseStudyDetail.module.css";

export type CaseStudyStat = {
  value: string;
  label: string;
};

export type CaseStudyDetailData = {
  _id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  logoUrl?: string;
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
};

const CaseStudyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CaseStudyDetailData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    if (!slug) {
      setStatus("missing");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    api
      .get<{ caseStudy?: CaseStudyDetailData }>(`/site/case-studies/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.caseStudy) {
          setData(res.data.caseStudy);
          setStatus("ok");
        } else {
          setData(null);
          setStatus("missing");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "missing") {
    return <Navigate to="/our-work" replace />;
  }

  if (status === "loading" || !data) {
    return (
      <div className={styles.loading} role="status">
        Loading case study…
      </div>
    );
  }

  const heroTitle = data.heroTitle?.trim() || data.title;
  const heroSubtitle = data.heroSubtitle?.trim() || data.description;
  const heroImage = data.heroImageUrl?.trim() || data.imageUrl;
  const showcase = (data.showcaseImageUrls ?? []).filter(Boolean);
  const stats = (data.stats ?? []).filter((s) => s.value?.trim() && s.label?.trim());
  const pathname = `/case-studies/${data.slug}`;
  const seoDesc =
    data.introText?.trim() ||
    data.narrativeBefore?.trim() ||
    data.description;

  return (
    <>
      <Seo
        title={`${heroTitle} — Case Study — Xaeon Software Solutions`}
        description={seoDesc}
        pathname={pathname}
        ogType="article"
        jsonLd={caseStudyJsonLd({
          pathname,
          name: heroTitle,
          description: seoDesc,
          image: heroImage,
        })}
      />

      <article className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden className={styles.breadcrumbSep}>
            /
          </span>
          <Link to="/our-work">Case Studies</Link>
          <span aria-hidden className={styles.breadcrumbSep}>
            /
          </span>
          <span className={styles.breadcrumbCurrent}>{data.title}</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroVisual}>
            <img src={heroImage} alt="" className={styles.heroImage} />
          </div>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>{heroTitle}</h1>
            <p className={styles.heroSubtitle}>{heroSubtitle}</p>
          </div>
        </header>

        {data.introText?.trim() ? (
          <section className={styles.intro} aria-label="Introduction">
            <p className={styles.introText}>{data.introText.trim()}</p>
          </section>
        ) : null}

        {(showcase.length > 0 || data.dashboardImageUrl?.trim()) && (
          <section className={styles.showcase} aria-label="Product showcase">
            {showcase.length > 0 ? (
              <div className={styles.showcaseCollage}>
                {showcase.map((src, i) => (
                  <img key={`${src}-${i}`} src={src} alt="" className={styles.showcaseThumb} />
                ))}
              </div>
            ) : (
              <div />
            )}
            {data.dashboardImageUrl?.trim() ? (
              <div className={styles.dashboardWrap}>
                <img
                  src={data.dashboardImageUrl.trim()}
                  alt=""
                  className={styles.dashboardImage}
                />
              </div>
            ) : null}
          </section>
        )}

        {data.narrativeBefore?.trim() ? (
          <section className={styles.narrative}>
            <p>{data.narrativeBefore.trim()}</p>
          </section>
        ) : null}

        {data.lifestyleImageUrl?.trim() ? (
          <section className={styles.lifestyle} aria-label="In context">
            <img src={data.lifestyleImageUrl.trim()} alt="" className={styles.lifestyleImage} />
          </section>
        ) : null}

        {data.narrativeAfter?.trim() ? (
          <section className={styles.narrative}>
            <p>{data.narrativeAfter.trim()}</p>
          </section>
        ) : null}

        {stats.length > 0 ? (
          <section className={styles.stats} aria-label="Results">
            <ul className={styles.statsGrid}>
              {stats.map((stat, i) => (
                <li key={`${stat.value}-${i}`} className={styles.statItem}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      <CallToAction />
    </>
  );
};

export default CaseStudyDetail;
