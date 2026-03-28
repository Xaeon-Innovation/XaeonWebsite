import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import styles from "./BookNowContact.module.css";

const OFFICE_ADDRESS =
  "13 Roushdy Basha, Mustafa Kamel WA Bolkli, Sidi Gaber, Alexandria, Egypt";

const CONTACT = {
  email: "info@xaeons.com",
  phoneDisplay: "+010-159-718-69",
  phoneE164: "+201015971869",
  whatsappE164: "201015971869",
  office: OFFICE_ADDRESS,
} as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  company: z.string().trim().max(120, "Company name is too long.").optional(),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
  email: z.string().trim().email("Please enter a valid email address."),
  message: z.string().trim().min(10, "Please add a short message."),
});

type FormValues = z.infer<typeof schema>;

function encodeMailto(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

const BookNowContact = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const subject = "Xaeon — New contact request";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      company: "",
      phone: "",
      email: "",
      message: "",
    },
  });

  const mapSrc = useMemo(() => {
    const q = encodeURIComponent(OFFICE_ADDRESS);
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const bodyLines = [
      `Name: ${values.name}`,
      `Company: ${values.company?.trim() ? values.company.trim() : "-"}`,
      `Phone: ${values.phone}`,
      `Email: ${values.email}`,
      "",
      values.message,
    ];

    const href = `mailto:${CONTACT.email}?subject=${encodeMailto(subject)}&body=${encodeMailto(bodyLines.join("\n"))}`;

    try {
      window.location.href = href;
      reset();
    } catch {
      setSubmitError("Could not open your email client. Please email us directly.");
    }
  });

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <span className={styles.kicker}>Contact us</span>
              <h2 className={styles.formTitle}>Get In Touch</h2>
            </div>

            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="book-name">
                  Name
                </label>
                <input
                  id="book-name"
                  className={styles.input}
                  placeholder="Your Name"
                  autoComplete="name"
                  {...register("name")}
                  aria-invalid={Boolean(errors.name) || undefined}
                />
                {errors.name?.message && <p className={styles.error}>{errors.name.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="book-company">
                  Company Name <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id="book-company"
                  className={styles.input}
                  placeholder="Company Name"
                  autoComplete="organization"
                  {...register("company")}
                  aria-invalid={Boolean(errors.company) || undefined}
                />
                {errors.company?.message && (
                  <p className={styles.error}>{errors.company.message}</p>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="book-phone">
                  Phone Number
                </label>
                <input
                  id="book-phone"
                  className={styles.input}
                  placeholder="Phone Number"
                  autoComplete="tel"
                  {...register("phone")}
                  aria-invalid={Boolean(errors.phone) || undefined}
                />
                {errors.phone?.message && <p className={styles.error}>{errors.phone.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="book-email">
                  Email Address
                </label>
                <input
                  id="book-email"
                  className={styles.input}
                  placeholder="Email Address"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={Boolean(errors.email) || undefined}
                />
                {errors.email?.message && <p className={styles.error}>{errors.email.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="book-message">
                  Message
                </label>
                <textarea
                  id="book-message"
                  className={styles.textarea}
                  placeholder="Let us know what you’re building and what you need help with."
                  rows={5}
                  {...register("message")}
                  aria-invalid={Boolean(errors.message) || undefined}
                />
                {errors.message?.message && (
                  <p className={styles.error}>{errors.message.message}</p>
                )}
              </div>

              {submitError && <p className={styles.submitError}>{submitError}</p>}
              {isSubmitSuccessful && (
                <p className={styles.submitSuccess}>Thanks — your email client should open now.</p>
              )}

              <button className={styles.submit} type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </form>
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

