/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import NavPublic from "./NavPublic";

export default function SignupForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [status, setStatus] = useState({ loading: false, message: "" });

  async function handleGoogleSignup() {
    try {
      setStatus({ loading: true, message: "" });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`, // or /dashboard if you prefer
          scopes: "email profile",
        },
      });
      if (error) {
        setStatus({
          loading: false,
          message: error.message || "Google sign-in failed.",
        });
        return;
      }
      // Supabase will redirect to Google; leave a friendly message until then
      setStatus({ loading: true, message: "Redirecting to Google…" });
    } catch (err) {
      setStatus({
        loading: false,
        message: err?.message || "Unexpected error.",
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, message: "" });

    const emailNormalized = email.trim().toLowerCase();
    if (!emailNormalized) {
      setStatus({ loading: false, message: "Please enter an email." });
      return;
    }
    if (!password || password.length < 6) {
      setStatus({
        loading: false,
        message: "Password must be at least 6 characters.",
      });
      return;
    }

    try {
      const safeRole = role === "admin" ? "admin" : "employee";

      const { data, error } = await supabase.auth.signUp({
        email: emailNormalized,
        password,
        options: {
          data: {
            full_name: fullName || null,
            role: safeRole, // <- used by DB sync to set profiles.user_role
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        const msg = error.message || "Signup failed";
        setStatus({ loading: false, message: msg });
        if (/already registered|exists|registered/i.test(msg)) {
          navigate("/login");
        }
        return;
      }

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("employee");

      const user = data.user;
      const isConfirmed = Boolean(
        user?.email_confirmed_at || user?.confirmed_at
      );

      if (!isConfirmed) {
        await supabase.auth.signOut();
        setStatus({
          loading: false,
          message:
            "We’ve sent you a confirmation email. Click the link, then log in.",
        });
        navigate("/login");
        return;
      }

      setStatus({ loading: false, message: "Account created!" });
      navigate("/dashboard");
    } catch (err) {
      setStatus({
        loading: false,
        message: err?.message || "Unexpected error during signup.",
      });
    }
  }

  return (
    <>
      <NavPublic />
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.h2}>Create account</h2>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          style={styles.googleButton}
          disabled={status.loading}
          aria-label="Sign up with Google"
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

        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>

        <label style={styles.label}>
          Full name
          <input
            style={styles.input}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ada Lovelace"
          />
        </label>

        <label style={styles.label}>
          Email*
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label style={styles.label}>
          Password*
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
          />
        </label>

        <button style={styles.button} type="submit" disabled={status.loading}>
          {status.loading ? "Creating…" : "Sign up"}
        </button>

        {status.message && <p style={styles.note}>{status.message}</p>}
      </form>
    </>
  );
}

const styles = {
  form: { maxWidth: 420, margin: "2rem auto", display: "grid", gap: 12 },
  h2: { margin: 0 },
  googleButton: {
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
  },
  divider: {
    position: "relative",
    textAlign: "center",
    margin: "8px 0 4px",
  },
  dividerText: {
    background: "#fff",
    padding: "0 8px",
    color: "#888",
    fontSize: 12,
    position: "relative",
    zIndex: 1,
  },
  segmented: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 6,
  },
  segmentBtn: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
  },
  segmentBtnActive: {
    borderColor: "#0d6efd",
    boxShadow: "0 0 0 2px rgba(13,110,253,0.15)",
  },
  label: { display: "grid", gap: 6, fontWeight: 500 },
  input: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    padding: "10px 14px",
    border: 0,
    borderRadius: 10,
    fontSize: 16,
    cursor: "pointer",
    background: "#0d6efd",
    color: "#fff",
  },
  note: { fontSize: 14, opacity: 0.8 },
};
