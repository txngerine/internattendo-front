import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

export default function InternDashboard() {
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [workDescription, setWorkDescription] = useState("");
  const [message, setMessage] = useState("");

  async function loadToday() {
    const { data } = await api.get("/attendance/today");
    setAttendance(data.attendance);
    if (data.attendance?.work_description)
      setWorkDescription(data.attendance.work_description);
  }

  useEffect(() => {
    loadToday();
  }, []);

  async function getLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        reject
      );
    });
  }

  async function handleCheckIn() {
    try {
      const location = await getLocation();
      const { data } = await api.post("/attendance/check-in", {
        workDescription,
        ...location,
      });
      setAttendance(data.attendance);
      setMessage("Checked in successfully.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Check-in failed");
    }
  }

  async function handleCheckOut() {
    try {
      const { data } = await api.post("/attendance/check-out");
      setAttendance(data.attendance);
      setMessage("Checked out successfully.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Check-out failed");
    }
  }

  async function updateWork() {
    try {
      const { data } = await api.patch("/attendance/work", {
        workDescription,
      });
      setAttendance(data.attendance);
      setMessage("Work updated.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Update failed");
    }
  }

  function formatAttendanceTime(value) {
    if (!value) return "--";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "--";
    return parsed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10 text-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Intern Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.full_name}
            </p>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">

          {/* Status */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">
              Today
            </h2>
            <StatusBadge status={attendance?.status} />
          </div>

          {/* Time Blocks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Login</p>
              <p className="text-sm font-medium mt-1">
                {formatAttendanceTime(attendance?.login_time)}
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Logout</p>
              <p className="text-sm font-medium mt-1">
                {formatAttendanceTime(attendance?.logout_time)}
              </p>
            </div>
          </div>

          {/* Work Input */}
          <div>
            <label className="text-sm text-gray-600">
              Work Description
            </label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="What are you working on today?"
              className="w-full mt-2 p-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">

            {!attendance && (
              <button
                onClick={handleCheckIn}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-black text-white hover:opacity-90 transition"
              >
                Check In
              </button>
            )}

            {attendance && !attendance.logout_time && (
              <button
                onClick={handleCheckOut}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:opacity-90 transition"
              >
                Check Out
              </button>
            )}

            {attendance && (
              <button
                onClick={updateWork}
                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                Update
              </button>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className="text-sm text-gray-600 border-t pt-3">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}