import { useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router";
import api, { getApiErrorMessage } from "../lib/api";
import styles from "./LoginSignup.module.css";

/** Invite landing page: a new client (or a user the admin created) sets their first password. */
export default function SetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ user: { role: string } }>("/auth/set-password", { token, password });
      // Full reload so the auth context picks up the new session cookie.
      window.location.assign(res.data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "This link is invalid or has expired. Ask us for a new one."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <Helmet>
        <title>Set your password — Xaeon</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className={styles.card} style={{ maxWidth: 440, margin: "0 auto" }}>
        <h1 className={styles.title}>Set your password</h1>
        {!token ? (
          <p className={styles.submitError}>This link is missing its code. Open the link from your invite email again.</p>
        ) : (
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sp-password">New password</label>
              <input id="sp-password" className={styles.input} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sp-confirm">Confirm password</label>
              <input id="sp-confirm" className={styles.input} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error ? <p className={styles.submitError} role="alert">{error}</p> : null}
            <button type="submit" className={styles.btn} disabled={busy}>
              {busy ? "Saving…" : "Save and sign in"}
            </button>
            <button type="button" className={styles.modeLink} onClick={() => navigate("/login")}>
              Already have a password? Log in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
