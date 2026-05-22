import { useState } from "react";
import api from "../../lib/api";

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

export default function InternsList({ interns, setInterns, reloadData }) {
  const [accessMessage, setAccessMessage] = useState("");
  const [accessUpdatingId, setAccessUpdatingId] = useState("");
  const [editingInternId, setEditingInternId] = useState("");
  const [editForm, setEditForm] = useState({ fullName: "", email: "", accessStatus: "pending" });
  const [deletingInternId, setDeletingInternId] = useState("");

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
      await reloadData();
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
      await reloadData();
    } catch (error) {
      setAccessMessage(error?.response?.data?.message || "Failed to delete intern.");
    } finally {
      setDeletingInternId("");
    }
  }

  return (
    <div className="card space-y-4 p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">
            Intern Login Access
          </h2>
          <p className="text-sm text-text-muted">
            Approve new interns or disable accounts from signing in.
          </p>
        </div>
        {accessMessage ? (
          <p className="text-sm whitespace-nowrap text-text-muted">
            {accessMessage}
          </p>
        ) : null}
      </div>

      <div className="overflow-auto rounded-xl border border-border">
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
                <tr key={intern.id} className="border-t border-border">
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
  );
}
