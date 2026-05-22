import { useState } from "react";
import api from "../../lib/api";
import StatusBadge from "../StatusBadge";

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

export default function AttendanceRecords({
  records,
  setRecords,
  interns,
  filters,
  setFilters,
  handleExport,
  todayDate,
  reloadData
}) {
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
      await reloadData();
    } catch (error) {
      setRecordsMessage(error?.response?.data?.message || "Failed to add attendance record.");
    } finally {
      setIsAddingAttendance(false);
    }
  }

  return (
    <div className="card space-y-4 p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-text">
          Attendance Records
        </h2>
        <div className="text-sm text-left sm:text-right">
          <p className="text-text-muted">
            {records.length} row{records.length === 1 ? "" : "s"} returned
          </p>
          {recordsMessage ? (
            <p className="mt-1 text-xs text-text-muted">
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
        <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 rounded-xl border border-border p-4">
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

      <div className="overflow-auto max-h-[420px] rounded-xl border border-border">
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
                <tr key={record.id} className="border-t border-border transition hover:bg-slate-50/70">
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
  );
}
