import { Link, Navigate, useParams } from "react-router";
import { getServiceBySlug } from "../data/servicesCatalog";
import { useAuth } from "../context/AuthContext";
import Seo from "../seo/Seo";
import { serviceJsonLd } from "../seo/schema";
import styles from "./ServiceDetail.module.css";
import contactStyles from "../Components/BookNow/BookNowContact.module.css";
import PublicEnquiryForm from "../Components/BookNow/PublicEnquiryForm";
import {
  getMeetingScheduleLink,
  isMeetingSchedulerUrlConfigured,
} from "../lib/meetingSchedule";

const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const service = slug ? getServiceBySlug(slug) : undefined;

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const formIdPrefix = `svc-${service.slug.replace(/[^a-z0-9-]/gi, "-")}`;

  const {
    href: bookConsultationHref,
    opensInNewTab: bookConsultationOpensNewTab,
  } = getMeetingScheduleLink({ serviceTitle: service.title });

  return (
    <>
      <Seo
        title={`${service.title} — Xaeon Software Solutions`}
        description={service.summary}
        pathname={`/services/${service.slug}`}
        ogType="article"
        jsonLd={serviceJsonLd({
          pathname: `/services/${service.slug}`,
          name: service.title,
          description: service.summary,
        })}
      />

      <article className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden className={styles.breadcrumbSep}>
            /
          </span>
          <Link to="/services">Services</Link>
          <span aria-hidden className={styles.breadcrumbSep}>
            /
          </span>
          <span className={styles.breadcrumbCurrent}>{service.title}</span>
        </nav>

        <h1 className={styles.title}>{service.title}</h1>
        <p className={styles.lead}>{service.summary}</p>
        <p className={styles.body}>{service.body}</p>

        <div className={styles.actions}>
          <a
            href={bookConsultationHref}
            className={styles.primaryCta}
            {...(bookConsultationOpensNewTab
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            Book a consultation
          </a>
          <Link to="/services" className={styles.secondaryCta}>
            All services
          </Link>
        </div>

        <section className={styles.enquirySection} aria-labelledby="svc-enquiry-heading">
          <h2 id="svc-enquiry-heading" className={styles.enquiryHeading}>
            Request this service
          </h2>
          {authLoading ? (
            <p className={styles.enquiryLead}>Loading…</p>
          ) : user ? (
            <>
              <p className={styles.enquiryLead}>
                You&apos;re signed in — continue in your dashboard to submit a
                registered request for <strong>{service.title}</strong>. We&apos;ll
                tie it to your account and keep status updates in one place.
              </p>
              <div className={styles.actions}>
                <Link
                  to={`/dashboard?serviceSlug=${encodeURIComponent(service.slug)}`}
                  className={styles.primaryCta}
                >
                  Continue in your dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className={styles.enquiryLead}>
                <strong>Book a consultation</strong> above is for scheduling a meeting
                {isMeetingSchedulerUrlConfigured()
                  ? " (opens in a new tab)."
                  : " (opens your email with a short template)."}
                {" "}
                Use this form to share project details — we’ll record your interest in{" "}
                <strong>{service.title}</strong> for our team.
              </p>
              <div className={contactStyles.formCard}>
                <PublicEnquiryForm
                  idPrefix={formIdPrefix}
                  source="service"
                  interest={service.title}
                />
              </div>
            </>
          )}
        </section>
      </article>
    </>
  );
};

export default ServiceDetail;
