import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import api from "../../lib/api";
import styles from "./BookNowContact.module.css";
import PublicEnquiryForm from "./PublicEnquiryForm";

const OFFICE_ADDRESS =
  "13 Roushdy Basha, Mustafa Kamel WA Bolkli, Sidi Gaber, Alexandria, Egypt";

const CONTACT = {
  email: "info@xaeons.com",
  phoneDisplay: "+010-159-718-69",
  phoneE164: "+201015971869",
  whatsappE164: "201015971869",
  office: OFFICE_ADDRESS,
} as const;

const BookNowContact = () => {
  const [searchParams] = useSearchParams();
  const packageIdParam = searchParams.get("package")?.trim() ?? "";
  const [packageTitle, setPackageTitle] = useState<string | null>(null);
  const [resolvedPackageId, setResolvedPackageId] = useState<string | null>(null);

  useEffect(() => {
    if (!packageIdParam) {
      setPackageTitle(null);
      setResolvedPackageId(null);
      return;
    }
    let cancelled = false;
    api
      .get(`/package/${encodeURIComponent(packageIdParam)}`)
      .then((res) => {
        const title = res.data?.package?.title;
        if (cancelled) return;
        if (typeof title === "string" && title.trim() !== "") {
          setPackageTitle(title.trim());
          setResolvedPackageId(packageIdParam);
        } else {
          setPackageTitle(null);
          setResolvedPackageId(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPackageTitle(null);
          setResolvedPackageId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [packageIdParam]);

  const mapSrc = useMemo(() => {
    const q = encodeURIComponent(OFFICE_ADDRESS);
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <span className={styles.kicker}>Contact us</span>
              <h2 className={styles.formTitle}>Get In Touch</h2>
            </div>

            {resolvedPackageId && packageTitle ? (
              <PublicEnquiryForm
                idPrefix="book"
                source="package"
                packageId={resolvedPackageId}
                packageTitle={packageTitle}
              />
            ) : (
              <PublicEnquiryForm idPrefix="book" source="contact" />
            )}
          </div>

          <aside className={styles.info}>
            <div className={styles.infoHeader}>
              <h2 className={styles.infoTitle}>Let&apos;s Build Something Timeless</h2>
              <p className={styles.infoCopy}>
                Whether you’re rethinking your brand or launching something new, Xaeon is built
                to help you lead—with clarity, impact, and purpose.
              </p>
            </div>

            <div className={styles.infoGrid}>
              <a className={`${styles.infoItem} ${styles.bounce1}`} href={`tel:${CONTACT.phoneE164}`}>
                <span className={styles.iconWrap} aria-hidden>
                  <Phone size={18} strokeWidth={1.9} />
                </span>
                <span className={styles.infoLabel}>Phone number</span>
                <span className={styles.infoValue}>{CONTACT.phoneDisplay}</span>
              </a>

              <a
                className={`${styles.infoItem} ${styles.bounce2}`}
                href={`mailto:${CONTACT.email}`}
              >
                <span className={styles.iconWrap} aria-hidden>
                  <Mail size={18} strokeWidth={1.9} />
                </span>
                <span className={styles.infoLabel}>Email Address</span>
                <span className={styles.infoValue}>{CONTACT.email}</span>
              </a>

              <a
                className={`${styles.infoItem} ${styles.bounce3}`}
                href={`https://wa.me/${CONTACT.whatsappE164}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className={styles.iconWrap} aria-hidden>
                  <FaWhatsapp size={18} />
                </span>
                <span className={styles.infoLabel}>Whatsapp</span>
                <span className={styles.infoValue}>{CONTACT.phoneDisplay}</span>
              </a>

              <div className={`${styles.infoItem} ${styles.bounce4}`}>
                <span className={styles.iconWrap} aria-hidden>
                  <MapPin size={18} strokeWidth={1.9} />
                </span>
                <span className={styles.infoLabel}>Our Office</span>
                <span className={styles.infoValue}>{CONTACT.office}</span>
              </div>
            </div>

            <div className={styles.mapWrap}>
              <iframe
                className={styles.map}
                src={mapSrc}
                title="Xaeon office location map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default BookNowContact;

