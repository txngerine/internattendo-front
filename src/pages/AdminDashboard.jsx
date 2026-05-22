import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatsOverview from "../components/Admin/StatsOverview";
import AttendanceChart from "../components/Admin/AttendanceChart";
import InternsList from "../components/Admin/InternsList";
import AttendanceRecords from "../components/Admin/AttendanceRecords";

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
  
  // Global State
  const [stats, setStats] = useState({});
  const [records, setRecords] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [interns, setInterns] = useState([]);
  const [filters, setFilters] = useState({ fromDate: todayDate, toDate: todayDate, status: "", name: "" });

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

  async function loadData() {
    const query = new URLSearchParams(filters).toString();
    try {
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
    } catch (error) {
      console.error("Failed to load admin data:", error);
    }
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
        alert("Export failed. Please login again and try.");
      });
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

        <StatsOverview attendanceRate={attendanceRate} stats={stats} />

        <InternsList interns={interns} setInterns={setInterns} reloadData={loadData} />

        <AttendanceChart chartData={chartData} weeklyInsights={weeklyInsights} />

        <AttendanceRecords
          records={records}
          setRecords={setRecords}
          interns={interns}
          filters={filters}
          setFilters={setFilters}
          handleExport={handleExport}
          todayDate={todayDate}
          reloadData={loadData}
        />
      </div>
    </div>
  );
}
