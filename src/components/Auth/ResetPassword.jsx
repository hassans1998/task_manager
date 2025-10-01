import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    kind: "idle",
  }); // 'idle' | 'error' | 'success'

  useEffect(() => {
    // 1) If redirected from email, Supabase sets a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // 2) Also listen for the event in case the session arrives just after mount
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 6) {
      setStatus({
        loading: false,
        message: "Password must be at least 6 characters.",
        kind: "error",
      });
      return;
    }
    if (password !== confirm) {
      setStatus({
        loading: false,
        message: "Passwords do not match.",
        kind: "error",
      });
      return;
    }

    setStatus({ loading: true, message: "", kind: "idle" });

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus({ loading: false, message: error.message, kind: "error" });
      return;
    }

    // Success: user is now signed in with a recovery session.
    setStatus({
      loading: false,
      message: "Password updated. Redirecting to login…",
      kind: "success",
    });
    navigate("/login", { replace: true });
  }

  if (!ready) return null; // or a spinner

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 420, margin: "2rem auto", display: "grid", gap: 12 }}
    >
      <h2>Set a new password</h2>

      <label className="form-label">
        New password
        <input
          className="form-control"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </label>

      <label className="form-label">
        Confirm new password
        <input
          className="form-control"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          required
        />
      </label>

      <button
        className="btn btn-success"
        type="submit"
        disabled={status.loading}
      >
        {status.loading ? "Updating…" : "Update password"}
      </button>

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
  );
}
