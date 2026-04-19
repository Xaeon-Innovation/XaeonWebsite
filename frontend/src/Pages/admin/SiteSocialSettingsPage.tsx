import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api, { getApiErrorMessage } from "../../lib/api";

const optionalUrl = z
  .string()
  .trim()
  .refine((s) => s === "" || URL.canParse(s), "Must be empty or a valid http(s) URL");

const mailtoOrEmailSchema = z
  .string()
  .trim()
  .refine((s) => {
    if (s === "") return true;
    if (/^mailto:/i.test(s)) return URL.canParse(s);
    if (s.includes("@") && !/\s/.test(s)) return true;
    return URL.canParse(s);
  }, "Enter a valid URL, email, or mailto: link");

const schema = z.object({
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  twitterUrl: optionalUrl,
  emailOrMailto: mailtoOrEmailSchema,
});

type FormValues = z.infer<typeof schema>;

const defaultForm: FormValues = {
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  twitterUrl: "",
  emailOrMailto: "mailto:info@xaeons.com",
};

export function Component() {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultForm,
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ siteSettings?: Record<string, string> }>("/admin/site-settings")
      .then((res) => {
        const s = res.data?.siteSettings;
        if (cancelled || !s) return;
        form.reset({
          facebookUrl: s.facebookUrl ?? "",
          instagramUrl: s.instagramUrl ?? "",
          linkedinUrl: s.linkedinUrl ?? "",
          twitterUrl: s.twitterUrl ?? "",
          emailOrMailto: s.emailUrl ?? "mailto:info@xaeons.com",
        });
      })
      .catch((e) => {
        if (!cancelled) setLoadError(getApiErrorMessage(e, "Failed to load settings"));
      });
    return () => {
      cancelled = true;
    };
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSaveMessage(null);
    setLoadError(null);
    let emailUrl = values.emailOrMailto.trim();
    if (emailUrl && !/^mailto:/i.test(emailUrl) && !/^https?:\/\//i.test(emailUrl) && emailUrl.includes("@")) {
      emailUrl = `mailto:${emailUrl}`;
    }
    try {
      await api.put("/admin/site-settings", {
        siteSettings: {
          facebookUrl: values.facebookUrl.trim(),
          instagramUrl: values.instagramUrl.trim(),
          linkedinUrl: values.linkedinUrl.trim(),
          twitterUrl: values.twitterUrl.trim(),
          emailUrl: emailUrl,
        },
      });
      setSaveMessage("Saved. Footer links will update for visitors on next load.");
    } catch (e) {
      setLoadError(getApiErrorMessage(e, "Save failed"));
    }
  });

  return (
    <>
      <Helmet>
        <title>Site — Social links — Xaeon Admin</title>
      </Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Site — Social &amp; contact links</h2>
      </div>
      <p style={{ color: "#94a3b8", marginBottom: 20, maxWidth: "36rem" }}>
        These URLs power the icons in the footer &quot;Contact us&quot; strip. Leave a field empty to hide that icon
        on the public site. Use full URLs (e.g. <code style={{ color: "#72c04f" }}>https://facebook.com/yourpage</code>
        ). For email, use <code style={{ color: "#72c04f" }}>mailto:you@domain.com</code> or just the address.
      </p>
      {loadError && <p style={{ color: "#ef4444", marginBottom: 12 }}>{loadError}</p>}
      {saveMessage && <p style={{ color: "#72c04f", marginBottom: 12 }}>{saveMessage}</p>}
      <form className="admin-form" onSubmit={onSubmit} style={{ maxWidth: "28rem" }}>
        {(
          [
            ["facebookUrl", "Facebook"],
            ["instagramUrl", "Instagram"],
            ["linkedinUrl", "LinkedIn"],
            ["twitterUrl", "Twitter / X"],
            ["emailOrMailto", "Email (mailto or address)"],
          ] as const
        ).map(([name, label]) => (
          <div className="admin-field" key={name}>
            <label className="admin-label" htmlFor={name}>
              {label}
            </label>
            <input id={name} className="admin-input" {...form.register(name)} placeholder={name === "emailOrMailto" ? "mailto:info@xaeons.com" : "https://…"} />
            {form.formState.errors[name] && (
              <p className="admin-field-error">{form.formState.errors[name]?.message as string}</p>
            )}
          </div>
        ))}
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </>
  );
}
