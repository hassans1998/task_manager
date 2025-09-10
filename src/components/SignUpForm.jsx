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
  const [status, setStatus] = useState({ loading: false, message: "" });

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
      // 1) Create auth user (email + password)
      const { data, error } = await supabase.auth.signUp({
        email: emailNormalized,
        password,
        options: {
          data: { full_name: fullName || null },
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

      // ⛔️ Removed: any INSERT/UPSERT into public.signups

      // Reset local form state
      setFullName("");
      setEmail("");
      setPassword("");

      // 2) Only allow dashboard if email is confirmed.
      const user = data.user;
      const isConfirmed = Boolean(
        user?.email_confirmed_at || user?.confirmed_at
      );

      if (!isConfirmed) {
        // If a session was created anyway, clear it so Login page doesn't auto-redirect.
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
  },
  note: { fontSize: 14, opacity: 0.8 },
};
