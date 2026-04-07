import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (user?.role === "Admin") return <Navigate to="/admin" replace />;
  if (user?.role === "Intern") return <Navigate to="/intern" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post("/public/register", { fullName, email, password });
      setSuccess(data.message || "Account created");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="app-shell auth-stage flex items-center justify-center">
      <div className="auth-orb left-[-5rem] top-[10%] h-48 w-48 bg-white/70" />
      <div className="auth-orb auth-orb-slow right-[-4rem] top-[62%] h-56 w-56 bg-slate-200/60" />
      <div className="auth-orb left-[24%] top-[-3rem] h-28 w-28 bg-slate-300/45" />

      <form onSubmit={onSubmit} className="card auth-form relative w-full max-w-md p-7 md:p-8">
        <h1 className="app-title text-[1.75rem]">Create Account</h1>
        <p className="app-subtitle mt-1">Register to access your attendance workspace.</p>
        {error && <p className="notice-error">{error}</p>}
        {success && <p className="notice-success">{success}</p>}

        <label className="field-label mt-5">Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input field-animate"
          required
        />

        <label className="field-label mt-4">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="input field-animate"
          required
        />

        <label className="field-label mt-4">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          minLength={6}
          className="input field-animate"
          required
        />

        <button className="btn-primary btn-premium mt-6 w-full">Register</button>
        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-medium" style={{ color: "var(--text)" }}>
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
