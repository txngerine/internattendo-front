import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

function StatCard({ title, value, subtitle }) {
  return (
    <div className="card p-5">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <h3 className="mt-1 text-3xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        {value}
      </h3>
      <p className="mt-1 text-xs uppercase tracking-wide" style={{ color: "#6b7280" }}>
        {subtitle}
      </p>
    </div>
  );
}

function WeeklyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <div className="rounded-xl border bg-white px-3 py-2 shadow-md" style={{ borderColor: "var(--border)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      {payload.map((item) => (
        <p key={item.dataKey} className="mt-1 text-sm" style={{ color: item.color }}>
          {item.name}: <span className="font-semibold">{item.value}</span>
        </p>
      ))}
      <p className="mt-2 border-t pt-1 text-sm font-semibold" style={{ color: "var(--text)", borderColor: "var(--border)" }}>
        Total: {total}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [stats, setStats] = useState({});
  const [records, setRecords] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [filters, setFilters] = useState({ fromDate: "", toDate: "", status: "", name: "" });

  const queryString = useMemo(() => new URLSearchParams(filters).toString(), [filters]);
  const chartData = useMemo(
    () =>
      weekly.map((item) => ({
        ...item,
        day: new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        Total: (item.Present || 0) + (item.Late || 0) + (item.Leave || 0) + (item.EarlyLeave || 0),
      })),
    [weekly]
  );

  const attendanceRate = useMemo(() => {
    const covered = (stats.presentToday || 0) + (stats.lateToday || 0) + (stats.earlyLeaveToday || 0);
    const total = stats.totalInterns || 0;
    if (!total) return 0;
    return Math.round((covered / total) * 100);
  }, [stats]);

  async function loadData() {
    const [statsRes, recordsRes, weeklyRes] = await Promise.all([
      api.get("/admin/stats"),
      api.get(`/admin/attendance?${queryString}`),
      api.get("/admin/weekly-summary"),
    ]);
    setStats(statsRes.data.stats);
    setRecords(recordsRes.data.records);
    setWeekly(weeklyRes.data.weekly);
  }

  useEffect(() => {
    loadData();
  }, [queryString]);

  function handleExport(format) {
    const params = new URLSearchParams({ ...filters, format }).toString();
    api
      .get(`/admin/export?${params}`, { responseType: "blob" })
      .then((response) => {
        const contentType = response.headers["content-type"] || "";
        const extension = contentType.includes("spreadsheetml") ? "xlsx" : "csv";
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `attendance.${extension}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        // Keep UI simple while still surfacing auth/export failures.
        alert("Export failed. Please login again and try.");
      });
  }

  return (
    <div className="app-shell">
      <div className="app-container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="app-title">Admin Command Center</h1>
            <p className="app-subtitle mt-1">Operational snapshot, attendance trend intelligence, and export controls.</p>
          </div>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>

        <div
          className="card relative overflow-hidden p-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.96) 60%, rgba(51,65,85,0.96) 100%)",
            borderColor: "#243247",
          }}
        >
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-16 h-48 w-48 rounded-full bg-slate-300/10 blur-2xl" />
          <div className="relative grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Today Attendance Rate</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{attendanceRate}%</p>
              <p className="mt-2 text-sm text-slate-300">Based on present, late, and early-leave interns.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Team Strength</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{stats.totalInterns || 0}</p>
              <p className="mt-2 text-sm text-slate-300">Registered interns currently managed.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Leave Count</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{stats.leaveToday || 0}</p>
              <p className="mt-2 text-sm text-slate-300">Interns marked as leave for today.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Interns" value={stats.totalInterns || 0} subtitle="active roster" />
          <StatCard title="Present Today" value={stats.presentToday || 0} subtitle="on-time check-ins" />
          <StatCard title="Late Today" value={stats.lateToday || 0} subtitle="after start threshold" />
          <StatCard title="On Leave" value={stats.leaveToday || 0} subtitle="outside attendance" />
          <StatCard title="Early Logout" value={stats.earlyLeaveToday || 0} subtitle="before end time" />
        </div>

        <div className="card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              Weekly Attendance Dynamics
            </h2>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
              stacked daily distribution + total trend
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf1" />
                <XAxis dataKey="day" tick={{ fill: "#5b687a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#5b687a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<WeeklyTooltip />} />
                <Legend />
                <Bar dataKey="Present" stackId="attendance" fill="#34d399" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Late" stackId="attendance" fill="#fbbf24" radius={[0, 0, 0, 0]} />
                <Bar dataKey="EarlyLeave" stackId="attendance" fill="#fb923c" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Leave" stackId="attendance" fill="#f87171" radius={[0, 0, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="Total"
                  stroke="#0f172a"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card space-y-4 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              Attendance Records
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {records.length} row{records.length === 1 ? "" : "s"} returned
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <input type="date" className="input" value={filters.fromDate} onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))} />
            <input type="date" className="input" value={filters.toDate} onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))} />
            <select className="input" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Leave">Leave</option>
              <option value="Early Leave">Early Leave</option>
            </select>
            <input
              placeholder="Search by name"
              className="input"
              value={filters.name}
              onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport("csv")} className="btn-primary">
              Export CSV
            </button>
            <button onClick={() => handleExport("xlsx")} className="btn-secondary">
              Export Excel
            </button>
          </div>

          <div className="overflow-auto max-h-[420px] rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="min-w-full text-sm">
              <thead className="sticky top-0" style={{ background: "#f3f6fa" }}>
                <tr className="text-left">
                  <th className="p-2">Name</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Login</th>
                  <th className="p-2">Logout</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Work</th>
                  <th className="p-2">Location Valid</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t transition hover:bg-slate-50/70" style={{ borderColor: "var(--border)" }}>
                    <td className="p-2">{record.profiles.full_name}</td>
                    <td className="p-2">{record.attendance_date}</td>
                    <td className="p-2">{record.login_time ? new Date(record.login_time).toLocaleString() : "-"}</td>
                    <td className="p-2">{record.logout_time ? new Date(record.logout_time).toLocaleString() : "-"}</td>
                    <td className="p-2">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="p-2 max-w-xs truncate">{record.work_description || "-"}</td>
                    <td className="p-2">{record.location_valid ? "Valid" : "Invalid"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
