import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api from "../../lib/api";
import styles from "./BookNowContact.module.css";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  company: z.string().trim().max(120, "Company name is too long.").optional(),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
  email: z.string().trim().email("Please enter a valid email address."),
  message: z.string().trim().min(10, "Please add a short message."),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  idPrefix: string;
  source: "contact" | "service" | "package";
  interest?: string;
  packageId?: string;
  packageTitle?: string;
  onSuccess?: () => void;
};

export default function PublicEnquiryForm({
  idPrefix,
  source,
  interest,
  packageId,
  packageTitle,
  onSuccess,
}: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const serviceRequest: Record<string, unknown> = {
        ...values,
        source,
        ...(interest ? { interest } : {}),
        ...(source === "package" && packageId ? { packageId } : {}),
      };
      await api.post("/system-request/enquiry", { serviceRequest });
      reset();
      onSuccess?.();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong.");
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {source === "package" && packageTitle ? (
        <p className={styles.packageContext} role="status">
          You&apos;re enquiring about <strong>{packageTitle}</strong>.
        </p>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-name`}>
          Name
        </label>
        <input
          id={`${idPrefix}-name`}
          className={styles.input}
          placeholder="Your Name"
          autoComplete="name"
          aria-describedby={errors.name ? `${idPrefix}-name-err` : undefined}
          {...register("name")}
        />
        {errors.name?.message && (
          <p id={`${idPrefix}-name-err`} className={styles.error} role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-company`}>
          Company Name <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id={`${idPrefix}-company`}
          className={styles.input}
          placeholder="Company Name"
          autoComplete="organization"
          aria-describedby={errors.company ? `${idPrefix}-company-err` : undefined}
          {...register("company")}
        />
        {errors.company?.message && (
          <p id={`${idPrefix}-company-err`} className={styles.error} role="alert">
            {errors.company.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-phone`}>
          Phone Number
        </label>
        <input
          id={`${idPrefix}-phone`}
          className={styles.input}
          placeholder="Phone Number"
          autoComplete="tel"
          aria-describedby={errors.phone ? `${idPrefix}-phone-err` : undefined}
          {...register("phone")}
        />
        {errors.phone?.message && (
          <p id={`${idPrefix}-phone-err`} className={styles.error} role="alert">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-email`}>
          Email Address
        </label>
        <input
          id={`${idPrefix}-email`}
          className={styles.input}
          placeholder="Email Address"
          autoComplete="email"
          aria-describedby={errors.email ? `${idPrefix}-email-err` : undefined}
          {...register("email")}
        />
        {errors.email?.message && (
          <p id={`${idPrefix}-email-err`} className={styles.error} role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-message`}>
          Message
        </label>
        <textarea
          id={`${idPrefix}-message`}
          className={styles.textarea}
          placeholder="Let us know what you’re building and what you need help with."
          rows={5}
          aria-describedby={errors.message ? `${idPrefix}-message-err` : undefined}
          {...register("message")}
        />
        {errors.message?.message && (
          <p id={`${idPrefix}-message-err`} className={styles.error} role="alert">
            {errors.message.message}
          </p>
        )}
      </div>

      {submitError && <p className={styles.submitError}>{submitError}</p>}
      {isSubmitSuccessful && (
        <p className={styles.submitSuccess}>Thanks — we received your message.</p>
      )}

      <button className={styles.submit} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
