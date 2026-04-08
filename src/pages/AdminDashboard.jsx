import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

function AccessBadge({ status }) {
  const styleMap = {
    approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    disabled: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize tracking-wide ${styleMap[status] || "bg-slate-100 text-slate-700 border border-slate-200"}`}>
      {status || "unknown"}
    </span>
  );
}

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

function formatTimeOnly(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString([], {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatTimeForInput(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(parsed);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.hour}:${map.minute}`;
}

function getIstTodayDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export default function AdminDashboard() {
  const todayDate = getIstTodayDate();
  const { logout } = useAuth();
  const [stats, setStats] = useState({});
  const [records, setRecords] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [interns, setInterns] = useState([]);
  const [filters, setFilters] = useState({ fromDate: todayDate, toDate: todayDate, status: "", name: "" });
  const [accessMessage, setAccessMessage] = useState("");
  const [accessUpdatingId, setAccessUpdatingId] = useState("");
  const [editingInternId, setEditingInternId] = useState("");
  const [editForm, setEditForm] = useState({ fullName: "", email: "", accessStatus: "pending" });
  const [deletingInternId, setDeletingInternId] = useState("");
  const [editingRecordId, setEditingRecordId] = useState("");
  const [recordForm, setRecordForm] = useState({
    status: "Present",
    workDescription: "",
    loginTime: "",
    logoutTime: "",
  });
  const [recordUpdatingId, setRecordUpdatingId] = useState("");
  const [deletingRecordId, setDeletingRecordId] = useState("");
  const [recordsMessage, setRecordsMessage] = useState("");
  const [showAddAttendance, setShowAddAttendance] = useState(false);
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [addAttendanceForm, setAddAttendanceForm] = useState({
    userId: "",
    attendanceDate: todayDate,
    status: "Present",
    workDescription: "",
    loginTime: "",
    logoutTime: "",
    locationValid: true,
  });

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

  const weeklyInsights = useMemo(() => {
    if (!chartData.length) {
      return { averageTotal: 0, peakDay: "-", peakTotal: 0, lowDay: "-", lowTotal: 0 };
    }

    const totals = chartData.map((item) => item.Total || 0);
    const averageTotal = Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length);
    const peakEntry = chartData.reduce((best, item) => (item.Total > best.Total ? item : best), chartData[0]);
    const lowEntry = chartData.reduce((best, item) => (item.Total < best.Total ? item : best), chartData[0]);

    return {
      averageTotal,
      peakDay: peakEntry.day,
      peakTotal: peakEntry.Total,
      lowDay: lowEntry.day,
      lowTotal: lowEntry.Total,
    };
  }, [chartData]);

  async function loadData(nextFilters = filters) {
    const query = new URLSearchParams(nextFilters).toString();
    const [statsRes, recordsRes, weeklyRes, internsRes] = await Promise.all([
      api.get("/admin/stats"),
      api.get(`/admin/attendance?${query}`),
      api.get("/admin/weekly-summary"),
      api.get("/admin/interns"),
    ]);
    setStats(statsRes.data.stats);
    setRecords(recordsRes.data.records);
    setWeekly(weeklyRes.data.weekly);
    setInterns(internsRes.data.interns || []);
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

  async function updateInternAccess(internId, accessStatus) {
    setAccessMessage("");
    setAccessUpdatingId(internId);

    try {
      const { data } = await api.patch(`/admin/interns/${internId}/access`, {
        accessStatus,
      });

      setInterns((current) =>
        current.map((intern) => (intern.id === internId ? data.intern : intern))
      );
      setAccessMessage(data.message || "Intern access updated.");
    } catch (error) {
      setAccessMessage(error?.response?.data?.message || "Failed to update intern access.");
    } finally {
      setAccessUpdatingId("");
    }
  }

  function startEditingIntern(intern) {
    setAccessMessage("");
    setEditingInternId(intern.id);
    setEditForm({
      fullName: intern.full_name || "",
      email: intern.email || "",
      accessStatus: intern.access_status || "pending",
    });
  }

  function cancelEditingIntern() {
    setEditingInternId("");
    setEditForm({ fullName: "", email: "", accessStatus: "pending" });
  }

  async function saveInternChanges(internId) {
    setAccessMessage("");
    setAccessUpdatingId(internId);

    try {
      const { data } = await api.patch(`/admin/interns/${internId}`, editForm);
      setInterns((current) =>
        current.map((intern) => (intern.id === internId ? data.intern : intern))
      );
      setAccessMessage(data.message || "Intern details updated.");
      cancelEditingIntern();
      await loadData();
    } catch (error) {
      setAccessMessage(error?.response?.data?.message || "Failed to update intern.");
    } finally {
      setAccessUpdatingId("");
    }
  }

  async function deleteIntern(intern) {
    const confirmed = window.confirm(`Delete ${intern.full_name}? This will remove their attendance records and login account.`);
    if (!confirmed) return;

    setAccessMessage("");
    setDeletingInternId(intern.id);

    try {
      const { data } = await api.delete(`/admin/interns/${intern.id}`);
      setInterns((current) => current.filter((item) => item.id !== intern.id));
      setAccessMessage(data.message || "Intern deleted.");
      if (editingInternId === intern.id) {
        cancelEditingIntern();
      }
      await loadData();
    } catch (error) {
      setAccessMessage(error?.response?.data?.message || "Failed to delete intern.");
    } finally {
      setDeletingInternId("");
    }
  }

  function startEditingRecord(record) {
    setRecordsMessage("");
    setEditingRecordId(record.id);
    setRecordForm({
      status: record.status || "Present",
      workDescription: record.work_description || "",
      loginTime: formatTimeForInput(record.login_time),
      logoutTime: formatTimeForInput(record.logout_time),
    });
  }

  function cancelEditingRecord() {
    setEditingRecordId("");
    setRecordForm({
      status: "Present",
      workDescription: "",
      loginTime: "",
      logoutTime: "",
    });
  }

  async function saveAttendanceRecord(recordId) {
    setRecordsMessage("");
    setRecordUpdatingId(recordId);

    try {
      const { data } = await api.patch(`/admin/attendance/${recordId}`, {
        status: recordForm.status,
        workDescription: recordForm.workDescription,
        loginTime: recordForm.loginTime,
        logoutTime: recordForm.logoutTime,
      });

      setRecords((current) =>
        current.map((record) => (record.id === recordId ? data.record : record))
      );
      setRecordsMessage(data.message || "Attendance record updated.");
      cancelEditingRecord();
    } catch (error) {
      setRecordsMessage(error?.response?.data?.message || "Failed to update attendance record.");
    } finally {
      setRecordUpdatingId("");
    }
  }

  async function deleteAttendanceRecord(recordId) {
    if (!window.confirm("Delete this attendance record? This cannot be undone.")) return;
    setRecordsMessage("");
    setDeletingRecordId(recordId);
    try {
      const { data } = await api.delete(`/admin/attendance/${recordId}`);
      setRecords((current) => current.filter((r) => r.id !== recordId));
      setRecordsMessage(data.message || "Attendance record deleted.");
    } catch (error) {
      setRecordsMessage(error?.response?.data?.message || "Failed to delete attendance record.");
    } finally {
      setDeletingRecordId("");
    }
  }

  async function addAttendanceRecord() {
    setRecordsMessage("");
    setIsAddingAttendance(true);

    try {
      const { data } = await api.post("/admin/attendance", addAttendanceForm);
      setRecords((current) => [data.record, ...current]);
      setRecordsMessage(data.message || "Attendance record added.");
      setShowAddAttendance(false);
      setAddAttendanceForm({
        userId: "",
        attendanceDate: todayDate,
        status: "Present",
        workDescription: "",
        loginTime: "",
        logoutTime: "",
        locationValid: true,
      });
      await loadData(filters);
    } catch (error) {
      setRecordsMessage(error?.response?.data?.message || "Failed to add attendance record.");
    } finally {
      setIsAddingAttendance(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="app-container space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="app-title text-xl sm:text-2xl md:text-3xl">Admin Command Center</h1>
            <p className="app-subtitle mt-1 text-xs sm:text-sm">Operational snapshot, attendance trend intelligence, and export controls.</p>
          </div>
          <button onClick={logout} className="btn-secondary whitespace-nowrap">
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
          <div className="relative grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
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

        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Interns" value={stats.totalInterns || 0} subtitle="active roster" />
          <StatCard title="Present Today" value={stats.presentToday || 0} subtitle="on-time check-ins" />
          <StatCard title="Late Today" value={stats.lateToday || 0} subtitle="after start threshold" />
          <StatCard title="On Leave" value={stats.leaveToday || 0} subtitle="outside attendance" />
          <StatCard title="Early Logout" value={stats.earlyLeaveToday || 0} subtitle="before end time" />
        </div>

        <div className="card space-y-4 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                Intern Login Access
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Approve new interns or disable accounts from signing in.
              </p>
            </div>
            {accessMessage ? (
              <p className="text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {accessMessage}
              </p>
            ) : null}
          </div>

          <div className="overflow-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="min-w-full text-sm">
              <thead style={{ background: "#f3f6fa" }}>
                <tr className="text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Access</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {interns.map((intern) => {
                  const isUpdating = accessUpdatingId === intern.id;
                  const isDeleting = deletingInternId === intern.id;
                  const isEditing = editingInternId === intern.id;

                  return (
                    <tr key={intern.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="p-3 font-medium">
                        {isEditing ? (
                          <input
                            className="input mt-0"
                            value={editForm.fullName}
                            onChange={(e) => setEditForm((current) => ({ ...current, fullName: e.target.value }))}
                            disabled={isUpdating}
                          />
                        ) : (
                          intern.full_name
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            className="input mt-0"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((current) => ({ ...current, email: e.target.value }))}
                            disabled={isUpdating}
                          />
                        ) : (
                          intern.email
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            className="input mt-0"
                            value={editForm.accessStatus}
                            onChange={(e) => setEditForm((current) => ({ ...current, accessStatus: e.target.value }))}
                            disabled={isUpdating}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        ) : (
                          <AccessBadge status={intern.access_status} />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveInternChanges(intern.id)}
                                className="btn-primary"
                                disabled={isUpdating}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditingIntern}
                                className="btn-secondary"
                                disabled={isUpdating}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditingIntern(intern)}
                                className="btn-primary"
                                disabled={isUpdating || isDeleting}
                              >
                                Edit
                              </button>
                              {intern.access_status !== "approved" ? (
                                <button
                                  onClick={() => updateInternAccess(intern.id, "approved")}
                                  className="btn-secondary"
                                  disabled={isUpdating || isDeleting}
                                >
                                  Approve
                                </button>
                              ) : null}
                              {intern.access_status !== "disabled" ? (
                                <button
                                  onClick={() => updateInternAccess(intern.id, "disabled")}
                                  className="btn-secondary"
                                  disabled={isUpdating || isDeleting}
                                >
                                  Disable
                                </button>
                              ) : null}
                              <button
                                onClick={() => deleteIntern(intern)}
                                className="btn-secondary"
                                disabled={isUpdating || isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 md:p-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              Weekly Attendance Dynamics
            </h2>
            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                curved weekly distribution + total trend
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Avg {weeklyInsights.averageTotal} | Peak {weeklyInsights.peakDay} ({weeklyInsights.peakTotal}) | Low {weeklyInsights.lowDay} ({weeklyInsights.lowTotal})
              </p>
            </div>
          </div>
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="lateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="earlyLeaveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="leaveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5eaf1" />
                <XAxis dataKey="day" tick={{ fill: "#5b687a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#5b687a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<WeeklyTooltip />} />
                <ReferenceLine
                  y={weeklyInsights.averageTotal}
                  stroke="#334155"
                  strokeDasharray="6 4"
                  label={{
                    value: `Avg ${weeklyInsights.averageTotal}`,
                    position: "right",
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <Legend />
                <Area
                  type="natural"
                  dataKey="Present"
                  stackId="attendance"
                  stroke="#16a34a"
                  fill="url(#presentFill)"
                  strokeWidth={2}
                />
                <Area
                  type="natural"
                  dataKey="Late"
                  stackId="attendance"
                  stroke="#d97706"
                  fill="url(#lateFill)"
                  strokeWidth={2}
                />
                <Area
                  type="natural"
                  dataKey="EarlyLeave"
                  stackId="attendance"
                  stroke="#ea580c"
                  fill="url(#earlyLeaveFill)"
                  strokeWidth={2}
                />
                <Area
                  type="natural"
                  dataKey="Leave"
                  stackId="attendance"
                  stroke="#dc2626"
                  fill="url(#leaveFill)"
                  strokeWidth={2}
                />
                <Line
                  type="natural"
                  dataKey="Total"
                  stroke="#0f172a"
                  strokeWidth={3}
                  dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card space-y-4 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              Attendance Records
            </h2>
            <div className="text-sm text-left sm:text-right">
              <p style={{ color: "var(--text-muted)" }}>
                {records.length} row{records.length === 1 ? "" : "s"} returned
              </p>
              {recordsMessage ? (
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {recordsMessage}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowAddAttendance((current) => !current)}
              className="btn-primary"
            >
              {showAddAttendance ? "Close" : "Add Attendance"}
            </button>
          </div>

          {showAddAttendance ? (
            <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
              <select
                className="input mt-0"
                value={addAttendanceForm.userId}
                onChange={(e) => setAddAttendanceForm((current) => ({ ...current, userId: e.target.value }))}
              >
                <option value="">Select Intern</option>
                {interns.map((intern) => (
                  <option key={intern.id} value={intern.id}>
                    {intern.full_name} ({intern.email})
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="input mt-0"
                value={addAttendanceForm.attendanceDate}
                onChange={(e) => setAddAttendanceForm((current) => ({ ...current, attendanceDate: e.target.value }))}
              />
              <select
                className="input mt-0"
                value={addAttendanceForm.status}
                onChange={(e) => setAddAttendanceForm((current) => ({ ...current, status: e.target.value }))}
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
                <option value="Early Leave">Early Leave</option>
              </select>
              <input
                type="time"
                className="input mt-0"
                value={addAttendanceForm.loginTime}
                onChange={(e) => setAddAttendanceForm((current) => ({ ...current, loginTime: e.target.value }))}
              />
              <input
                type="time"
                className="input mt-0"
                value={addAttendanceForm.logoutTime}
                onChange={(e) => setAddAttendanceForm((current) => ({ ...current, logoutTime: e.target.value }))}
              />
              <select
                className="input mt-0"
                value={addAttendanceForm.locationValid ? "valid" : "invalid"}
                onChange={(e) =>
                  setAddAttendanceForm((current) => ({
                    ...current,
                    locationValid: e.target.value === "valid",
                  }))
                }
              >
                <option value="valid">Location Valid</option>
                <option value="invalid">Location Invalid</option>
              </select>
              <input
                className="input mt-0 lg:col-span-2"
                placeholder="Work description"
                value={addAttendanceForm.workDescription}
                onChange={(e) => setAddAttendanceForm((current) => ({ ...current, workDescription: e.target.value }))}
              />
              <button
                onClick={addAttendanceRecord}
                className="btn-primary col-span-1"
                disabled={isAddingAttendance}
              >
                {isAddingAttendance ? "Adding..." : "Save Attendance"}
              </button>
            </div>
          ) : null}

          <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => handleExport("csv")} className="btn-primary flex-1 sm:flex-none">
              Export CSV
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              className="inline-flex items-center justify-center flex-1 sm:flex-none rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition bg-emerald-600 hover:bg-emerald-700"
            >
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
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const isEditing = editingRecordId === record.id;
                  const isUpdating = recordUpdatingId === record.id;
                  const isDeleting = deletingRecordId === record.id;

                  return (
                    <tr key={record.id} className="border-t transition hover:bg-slate-50/70" style={{ borderColor: "var(--border)" }}>
                      <td className="p-2">{record.profiles.full_name}</td>
                      <td className="p-2">{record.attendance_date}</td>
                      <td className="p-2">
                        {isEditing ? (
                          <input
                            type="time"
                            className="input mt-0"
                            value={recordForm.loginTime}
                            onChange={(e) => setRecordForm((current) => ({ ...current, loginTime: e.target.value }))}
                            disabled={isUpdating}
                          />
                        ) : (
                          formatTimeOnly(record.login_time)
                        )}
                      </td>
                      <td className="p-2">
                        {isEditing ? (
                          <input
                            type="time"
                            className="input mt-0"
                            value={recordForm.logoutTime}
                            onChange={(e) => setRecordForm((current) => ({ ...current, logoutTime: e.target.value }))}
                            disabled={isUpdating}
                          />
                        ) : (
                          formatTimeOnly(record.logout_time)
                        )}
                      </td>
                      <td className="p-2">
                        {isEditing ? (
                          <select
                            className="input mt-0"
                            value={recordForm.status}
                            onChange={(e) => setRecordForm((current) => ({ ...current, status: e.target.value }))}
                            disabled={isUpdating}
                          >
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Leave">Leave</option>
                            <option value="Early Leave">Early Leave</option>
                          </select>
                        ) : (
                          <StatusBadge status={record.status} />
                        )}
                      </td>
                      <td className="p-2 max-w-xs">
                        {isEditing ? (
                          <input
                            className="input mt-0"
                            value={recordForm.workDescription}
                            onChange={(e) => setRecordForm((current) => ({ ...current, workDescription: e.target.value }))}
                            disabled={isUpdating}
                          />
                        ) : (
                          <p className="truncate">{record.work_description || "-"}</p>
                        )}
                      </td>
                      <td className="p-2">{record.location_valid ? "Valid" : "Invalid"}</td>
                      <td className="p-2">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveAttendanceRecord(record.id)}
                                className="btn-primary"
                                disabled={isUpdating}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditingRecord}
                                className="btn-secondary"
                                disabled={isUpdating}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditingRecord(record)}
                                className="btn-secondary"
                                disabled={Boolean(recordUpdatingId) || isDeleting}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteAttendanceRecord(record.id)}
                                className="inline-flex items-center justify-center rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold transition border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                disabled={Boolean(recordUpdatingId) || isDeleting}
                              >
                                {isDeleting ? "..." : "Delete"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
