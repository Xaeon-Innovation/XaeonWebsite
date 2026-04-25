import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api, { getApiErrorMessage } from "../lib/api";
import styles from "./LoginSignup.module.css";
import { useAuth } from "../context/AuthContext";
import Seo from "../seo/Seo";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const registerSchema = z.object({
  first_name: z.string().trim().min(2, "First name is required."),
  last_name: z.string().trim().min(2, "Last name is required."),
  company: z.string().trim().max(120, "Company name is too long.").optional(),
  phone_number: z.string().trim().min(7, "Please enter a valid phone number."),
  email: z.string().trim().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

type Mode = "login" | "register";

const LoginSignup = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      first_name: "",
      last_name: "",
      company: "",
      phone_number: "",
      email: "",
      password: "",
    },
  });

  const { login, refresh } = useAuth();

  const switchMode = (nextMode: Mode) => {
    if (nextMode === mode) return;

    setSubmitError(null);
    setSubmitSuccess(null);
    setMode(nextMode);
  };

  const onLogin = loginForm.handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const user = await login(values);
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (e) {
      setSubmitError(getApiErrorMessage(e, "Login failed."));
    }
  });

  const onRegister = registerForm.handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await api.post("/auth/register", values);
      await refresh();
      setSubmitSuccess("Account created. You’re logged in.");
      navigate("/", { replace: true });
    } catch (e) {
      setSubmitError(getApiErrorMessage(e, "Registration failed."));
    }
  });

  return (
    <section
      className={styles.wrap}
      aria-label={mode === "login" ? "Log in" : "Register"}
    >
      <Seo
        title={`${mode === "login" ? "Log in" : "Register"} — Xaeon`}
        pathname={mode === "login" ? "/login" : "/register"}
        noindex
      />

      <div className={styles.bg} aria-hidden />

      <div className={styles.card}>
        <div className={styles.left}>
          <div className={styles.modeRow}>
            <button
              type="button"
              className={`${styles.modeLink} ${mode === "login" ? styles.modeActive : ""}`}
              onClick={() => switchMode("login")}
            >
              Log in
            </button>
            <button
              type="button"
              className={`${styles.modeLink} ${mode === "register" ? styles.modeActive : ""}`}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
          </div>

          <h1 className={styles.title}>
            {mode === "login" ? "Log In" : "Register"}
          </h1>

          {mode === "login" ? (
            <form className={styles.form} onSubmit={onLogin} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  className={styles.input}
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email?.message && (
                  <p className={styles.error}>
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  className={styles.input}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password?.message && (
                  <p className={styles.error}>
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {submitError && <p className={styles.submitError}>{submitError}</p>}
              {submitSuccess && <p className={styles.success}>{submitSuccess}</p>}

              <button
                className={styles.btn}
                type="submit"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? "Signing in..." : "Log in"}
              </button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={onRegister} noValidate>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-first">
                    First name
                  </label>
                  <input
                    id="reg-first"
                    className={styles.input}
                    autoComplete="given-name"
                    placeholder="Abdelrahman"
                    {...registerForm.register("first_name")}
                  />
                  {registerForm.formState.errors.first_name?.message && (
                    <p className={styles.error}>
                      {registerForm.formState.errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-last">
                    Last name
                  </label>
                  <input
                    id="reg-last"
                    className={styles.input}
                    autoComplete="family-name"
                    placeholder="Elasrag"
                    {...registerForm.register("last_name")}
                  />
                  {registerForm.formState.errors.last_name?.message && (
                    <p className={styles.error}>
                      {registerForm.formState.errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="reg-company">
                  Company (optional)
                </label>
                <input
                  id="reg-company"
                  className={styles.input}
                  autoComplete="organization"
                  placeholder="Xaeon"
                  {...registerForm.register("company")}
                />
                {registerForm.formState.errors.company?.message && (
                  <p className={styles.error}>
                    {registerForm.formState.errors.company.message}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="reg-phone">
                  Phone number
                </label>
                <input
                  id="reg-phone"
                  className={styles.input}
                  autoComplete="tel"
                  placeholder="+20..."
                  {...registerForm.register("phone_number")}
                />
                {registerForm.formState.errors.phone_number?.message && (
                  <p className={styles.error}>
                    {registerForm.formState.errors.phone_number.message}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  className={styles.input}
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email?.message && (
                  <p className={styles.error}>
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="reg-password">
                  Password
                </label>
                <input
                  id="reg-password"
                  className={styles.input}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  {...registerForm.register("password")}
                />
                {registerForm.formState.errors.password?.message && (
                  <p className={styles.error}>
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {submitError && <p className={styles.submitError}>{submitError}</p>}
              {submitSuccess && <p className={styles.success}>{submitSuccess}</p>}

              <button
                className={styles.btn}
                type="submit"
                disabled={registerForm.formState.isSubmitting}
              >
                {registerForm.formState.isSubmitting ? "Creating..." : "Register"}
              </button>
            </form>
          )}
        </div>

        <aside className={styles.right} aria-label="Welcome">
          <h2 className={styles.rightTitle}>
            {mode === "login" ? "Welcome back!" : "Welcome!"}
          </h2>
          <p className={styles.rightText}>
            {mode === "login"
              ? "Sign in to manage your requests and access your dashboard."
              : "Create a user account to submit requests and track updates. Admin access is managed separately."}
          </p>
        </aside>
      </div>
    </section>
  );
};

export default LoginSignup;