import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const { user, session, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      if (!supabase) {
        if (active) setCheckingSession(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (!data.session && !session) {
        setError("Reset link is invalid or expired. Please request a new one.");
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [session]);

  if (user?.role === "Admin") return <Navigate to="/admin" replace />;
  if (user?.role === "Intern") return <Navigate to="/intern" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    if (updateError) {
      setError(updateError.message || "Failed to reset password");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Password updated successfully. Redirecting to login...");
    setTimeout(() => navigate("/login"), 1200);
  }

  return (
    <div className="app-shell auth-stage flex items-center justify-center overflow-hidden">
      <div className="hidden sm:block auth-orb left-[-5rem] top-[10%] h-48 w-48 bg-white/70" />
      <div className="hidden sm:block auth-orb auth-orb-slow right-[-4rem] top-[62%] h-56 w-56 bg-slate-200/60" />
      <div className="hidden sm:block auth-orb left-[24%] top-[-3rem] h-28 w-28 bg-slate-300/45" />

      <form onSubmit={onSubmit} className="card auth-form relative w-full max-w-sm mx-3 p-6 sm:p-7 md:p-8">
        <h1 className="app-title text-xl sm:text-2xl md:text-[1.75rem]">Reset Password</h1>
        <p className="app-subtitle mt-1 text-xs sm:text-sm">Set a new password for your account.</p>

        {checkingSession ? <p className="notice-success">Verifying reset link...</p> : null}
        {error && <p className="notice-error">{error}</p>}
        {success && <p className="notice-success">{success}</p>}

        <label className="field-label mt-5">New Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          minLength={6}
          className="input field-animate"
          disabled={isSubmitting || checkingSession}
          required
        />

        <label className="field-label mt-4">Confirm Password</label>
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          minLength={6}
          className="input field-animate"
          disabled={isSubmitting || checkingSession}
          required
        />

        <button className="btn-primary btn-premium mt-6 w-full" type="submit" disabled={isSubmitting || checkingSession}>
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>

        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Want to sign in instead?{" "}
          <Link to="/login" className="font-medium" style={{ color: "var(--text)" }}>
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
