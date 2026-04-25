import { Link } from "react-router";
import Seo from "../seo/Seo";
import styles from "./Legal.module.css";

const Terms = () => {
  return (
    <>
      <Seo
        title="Terms & Conditions — Xaeon Software Solutions"
        description="Terms and conditions for using Xaeon Software Solutions websites and services."
        pathname="/terms"
      />
      <article className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.title}>Terms &amp; conditions</h1>
          <p className={styles.updated}>Last updated: April 18, 2025</p>
          <div className={styles.prose}>
            <p>
              These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of the websites,
              applications, and related services offered by Xaeon Software Solutions (&quot;Xaeon,&quot;
              &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By using our services, you agree to these Terms.
            </p>

            <h2>Services</h2>
            <p>
              Descriptions of our services on this site are for general information. Specific deliverables,
              timelines, and fees are defined only in a written agreement or statement of work between you and Xaeon.
            </p>

            <h2>Acceptable use</h2>
            <p>You agree not to misuse our services, including by attempting to:</p>
            <ul>
              <li>Access systems or data without authorization;</li>
              <li>Introduce malware or disrupt infrastructure;</li>
              <li>Use our brand or materials in a way that is misleading or unlawful.</li>
            </ul>

            <h2>Intellectual property</h2>
            <p>
              Unless otherwise agreed in writing, Xaeon retains rights to pre-existing materials, tools, and
              know-how. Ownership of custom deliverables will be as set out in your contract with us.
            </p>

            <h2>Disclaimer</h2>
            <p>
              Our site and content are provided &quot;as is&quot; to the extent permitted by law. We do not warrant
              uninterrupted or error-free operation. Liability is limited to the maximum extent permitted by applicable
              law and, where permitted, to fees paid to us for the specific engagement giving rise to the claim.
            </p>

            <h2>Changes</h2>
            <p>
              We may update these Terms from time to time. Continued use of the site after changes constitutes
              acceptance of the revised Terms.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about these Terms:{" "}
              <a href="mailto:info@xaeons.com">info@xaeons.com</a> or via our{" "}
              <Link to="/book-now">contact page</Link>.
            </p>
          </div>
        </div>
      </article>
    </>
  );
};

export default Terms;
