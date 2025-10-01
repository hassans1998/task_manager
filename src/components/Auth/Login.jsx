// src/components/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import NavPublic from "../NavPublic";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    kind: "idle", // 'idle' | 'error' | 'success'
  });

  // If already logged in & confirmed, redirect to dashboard
  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      const isConfirmed = Boolean(
        user?.email_confirmed_at || user?.confirmed_at
      );
      if (isConfirmed) navigate("/dashboard", { replace: true });
    })();
  }, [navigate]);

  // --- Google OAuth login ---
  async function handleGoogleLogin() {
    try {
      setStatus({ loading: true, message: "", kind: "idle" });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        setStatus({
          loading: false,
          message: error.message || "Google login failed.",
          kind: "error",
        });
      } else {
        setStatus({ loading: true, message: "Redirecting…", kind: "idle" });
      }
    } catch (err) {
      setStatus({
        loading: false,
        message: err?.message || "Unexpected error during Google login.",
        kind: "error",
      });
    }
  }

  // --- Email/password login ---
  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, message: "", kind: "idle" });

    const emailNormalized = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: emailNormalized,
      password,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      const looksUnconfirmed =
        msg.includes("confirm") ||
        msg.includes("validate") ||
        msg.includes("verify") ||
        msg.includes("not allowed") ||
        msg.includes("invalid login credentials");

      setStatus({
        loading: false,
        message: looksUnconfirmed
          ? "Either your credentials are wrong or your email isn’t confirmed yet. If you didn’t get the email, click “Resend confirmation”."
          : error.message || "Invalid login credentials",
        kind: "error",
      });
      return;
    }

    // Check confirmation after login
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    const isConfirmed = Boolean(user?.email_confirmed_at || user?.confirmed_at);

    if (!isConfirmed) {
      await supabase.auth.signOut();
      setStatus({
        loading: false,
        message:
          "Please confirm your email first. Didn’t get it? Click “Resend confirmation”.",
        kind: "error",
      });
      return;
    }

    setStatus({ loading: false, message: "", kind: "idle" });
    navigate("/dashboard");
  }

  // --- Forgot password ---
  async function handleForgotPassword() {
    if (!email) {
      setStatus({
        loading: false,
        message: "Enter your email above, then click “Forgot password?”.",
        kind: "error",
      });
      return;
    }

    setStatus({ loading: true, message: "", kind: "idle" });

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    if (error) {
      setStatus({ loading: false, message: error.message, kind: "error" });
      return;
    }

    setStatus({
      loading: false,
      message: "✅ Password reset email sent. Check your inbox.",
      kind: "success",
    });
  }

  // --- Resend confirmation ---
  async function handleResendConfirmation() {
    if (!email) {
      setStatus({
        loading: false,
        message: "Enter your email above, then click “Resend confirmation”.",
        kind: "error",
      });
      return;
    }

    setStatus({ loading: true, message: "", kind: "idle" });

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });

    if (error) {
      setStatus({ loading: false, message: error.message, kind: "error" });
      return;
    }

    setStatus({
      loading: false,
      message: "✅ Confirmation email sent. Check your inbox.",
      kind: "success",
    });
  }

  // --- Magic link login ---
  async function handleMagicLink() {
    if (!email) {
      setStatus({
        loading: false,
        message: "Enter your email above, then click “Email me a login link”.",
        kind: "error",
      });
      return;
    }

    setStatus({ loading: true, message: "", kind: "idle" });

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setStatus({ loading: false, message: error.message, kind: "error" });
      return;
    }

    setStatus({
      loading: false,
      message: "✅ Magic link sent! Check your inbox.",
      kind: "success",
    });
  }

  return (
    <>
      <NavPublic />
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 420, margin: "2rem auto", display: "grid", gap: 12 }}
      >
        <h2>Log in</h2>

        {/* Google login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 10,
            background: "#fff",
            cursor: "pointer",
            fontSize: 16,
          }}
          disabled={status.loading}
        >
          <svg
            style={{ width: 18, height: 18, marginRight: 8 }}
            viewBox="0 0 533.5 544.3"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#4285f4"
              d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.2H272v95.0h147.0c-6.3 34.0-25.3 62.8-53.9 82.0v68.1h87.2c51.0-47.0 80.2-116.2 80.2-194.9z"
            />
            <path
              fill="#34a853"
              d="M272 544.3c72.9 0 134.2-24.1 178.9-65.2l-87.2-68.1c-24.2 16.2-55.2 25.8-91.7 25.8-70.5 0-130.2-47.6-151.6-111.5H30.2v69.9c44.6 88.4 136.2 149.1 241.8 149.1z"
            />
            <path
              fill="#fbbc04"
              d="M120.4 325.3c-10.6-31.6-10.6-65.6 0-97.2v-69.9H30.2c-39.9 79.8-39.9 174.3 0 254.1l90.2-69.9z"
            />
            <path
              fill="#ea4335"
              d="M272 106.9c39.6-.6 77.7 14.5 106.7 42.3l79.8-79.8C405.9 24.9 343.8 0 272 0 166.4 0 74.8 60.7 30.2 149.1l90.2 69.9C141.8 155.1 201.5 107.5 272 106.9z"
            />
          </svg>
          Continue with Google
        </button>

        <label className="form-label">
          Email
          <input
            className="form-control"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="form-label">
          Password
          <input
            className="form-control"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={status.loading}
        >
          {status.loading ? "Signing in…" : "Log in"}
        </button>

        <div className="d-flex gap-3 mt-2" style={{ flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={handleForgotPassword}
            disabled={status.loading}
          >
            Forgot password?
          </button>

          <button
            type="button"
            className="btn btn-link p-0"
            onClick={handleResendConfirmation}
            disabled={status.loading}
          >
            Resend confirmation
          </button>

          <button
            type="button"
            className="btn btn-link p-0"
            onClick={handleMagicLink}
            disabled={status.loading}
          >
            Email me a login link
          </button>
        </div>

        {status.message && (
          <p
            className={`my-1 ${
              status.kind === "error" ? "text-danger" : "text-success"
            }`}
          >
            {status.message}
          </p>
        )}
      </form>
    </>
  );
}
