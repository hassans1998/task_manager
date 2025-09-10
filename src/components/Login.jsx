// src/components/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import NavPublic from "./NavPublic";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    kind: "idle",
  }); // kind: 'idle' | 'error' | 'success'

  // If already logged in AND confirmed, skip to dashboard
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

    // Double-check confirmation after login (paranoid but safe)
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
      message: "Password reset email sent. Check your inbox.",
      kind: "success",
    });
  }

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
      message: "Confirmation email sent. Check your inbox.",
      kind: "success",
    });
  }

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
      message: "Magic link sent! Check your inbox.",
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
