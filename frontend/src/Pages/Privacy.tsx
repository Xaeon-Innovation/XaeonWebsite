import { Link } from "react-router";
import Seo from "../seo/Seo";
import styles from "./Legal.module.css";

const Privacy = () => {
  return (
    <>
      <Seo
        title="Privacy Policy — Xaeon Software Solutions"
        description="How Xaeon Software Solutions collects, uses, and protects personal information."
        pathname="/privacy"
      />
      <article className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.title}>Privacy policy</h1>
          <p className={styles.updated}>Last updated: October 25, 2026</p>
          <div className={styles.prose}>
            <p>
              Xaeon Software Solutions (&quot;Xaeon,&quot; &quot;we,&quot; &quot;us&quot;) respects your privacy.
              This policy describes how we handle information when you visit our website or engage our services.
            </p>

            <h2>Information we collect</h2>
            <p>Depending on how you interact with us, we may collect:</p>
            <ul>
              <li>Contact details you submit (name, email, phone, company);</li>
              <li>Messages and files you send when requesting a quote or support;</li>
              <li>Technical data such as IP address, browser type, and approximate location from standard server logs.</li>
            </ul>

            <h2>How we use information</h2>
            <p>We use this information to:</p>
            <ul>
              <li>Respond to inquiries and deliver contracted services;</li>
              <li>Operate, secure, and improve our website;</li>
              <li>Comply with legal obligations.</li>
            </ul>

            <h2>Cookies &amp; analytics</h2>
            <p>
              We use cookies and similar technologies that are needed for the site to work, such as keeping you
              signed in to your client dashboard.
            </p>
            <p>
              With your consent, we also use Google Analytics to understand how visitors find and use the site,
              and the Meta Pixel to measure our advertising. Until you accept, Google Analytics runs without
              cookies and the Meta Pixel does not load. You can change your choice at any time with the
              &ldquo;Cookie settings&rdquo; link in the footer.
            </p>
            <p>
              When you send us an enquiry or book a call, we record how you arrived at our site (for example the
              campaign link, referring website and the first page you visited) with your request, so we know which
              of our channels are working. You can also control cookies through your browser settings.
            </p>

            <h2>Sharing</h2>
            <p>
              We do not sell your personal information. We may share data with trusted processors (e.g., hosting,
              email) who assist our operations under appropriate agreements, or when required by law.
            </p>

            <h2>Retention &amp; security</h2>
            <p>
              We retain information only as long as needed for the purposes above or as required by law. We apply
              reasonable technical and organizational measures to protect data.
            </p>

            <h2>Your rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, delete, or object to certain
              processing of your personal data. Contact us to make a request.
            </p>

            <h2>Contact</h2>
            <p>
              Privacy questions: <a href="mailto:info@xaeons.com">info@xaeons.com</a> or{" "}
              <Link to="/book-now">book a consultation</Link>.
            </p>
          </div>
        </div>
      </article>
    </>
  );
};

export default Privacy;
