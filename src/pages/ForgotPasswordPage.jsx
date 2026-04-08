import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPasswordPage() {
  const { user, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user?.role === "Admin") return <Navigate to="/admin" replace />;
  if (user?.role === "Intern") return <Navigate to="/intern" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const { error: resetError } = await requestPasswordReset(email);
    if (resetError) {
      setError(resetError.message || "Failed to send reset email");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Password reset link sent. Please check your email inbox.");
    setIsSubmitting(false);
  }

  return (
    <div className="app-shell auth-stage flex items-center justify-center overflow-hidden">
      <div className="hidden sm:block auth-orb left-[-5rem] top-[10%] h-48 w-48 bg-white/70" />
      <div className="hidden sm:block auth-orb auth-orb-slow right-[-4rem] top-[62%] h-56 w-56 bg-slate-200/60" />
      <div className="hidden sm:block auth-orb left-[24%] top-[-3rem] h-28 w-28 bg-slate-300/45" />

      <form onSubmit={onSubmit} className="card auth-form relative w-full max-w-sm mx-3 p-6 sm:p-7 md:p-8">
        <h1 className="app-title text-xl sm:text-2xl md:text-[1.75rem]">Forgot Password</h1>
        <p className="app-subtitle mt-1 text-xs sm:text-sm">Enter your email to receive a reset link.</p>

        {error && <p className="notice-error">{error}</p>}
        {success && <p className="notice-success">{success}</p>}

        <label className="field-label mt-5">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="input field-animate"
          disabled={isSubmitting}
          required
        />

        <button className="btn-primary btn-premium mt-6 w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Remembered your password?{" "}
          <Link to="/login" className="font-medium" style={{ color: "var(--text)" }}>
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
