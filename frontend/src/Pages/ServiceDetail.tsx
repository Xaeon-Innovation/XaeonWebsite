import { Helmet } from "react-helmet-async";
import { Link, Navigate, useParams } from "react-router";
import { getServiceBySlug } from "../data/servicesCatalog";
import styles from "./ServiceDetail.module.css";

const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? getServiceBySlug(slug) : undefined;

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{service.title} — Xaeon Software Solutions</title>
        <meta name="description" content={service.summary} />
      </Helmet>

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
          <Link to="/book-now" className={styles.primaryCta}>
            Book a consultation
          </Link>
          <Link to="/services" className={styles.secondaryCta}>
            All services
          </Link>
        </div>
      </article>
    </>
  );
};

export default ServiceDetail;
