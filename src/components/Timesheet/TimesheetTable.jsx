// src/components/timesheets/TimesheetTable.jsx
import React from "react";

export default function TimesheetTable({
  loading,
  timesheets,
  projects,
  projectName,
  toYMD,
  fmtDT,
  editingId,
  editValues,
  setEditValues,
  startEdit,
  cancelEdit,
  saveEdit,
  handleDelete,
  openView,
  profilesById,
  user,
  isAdmin,
}) {
  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered align-middle">
        <thead>
          <tr>
            <th>Project</th>
            <th>Week Start</th>
            <th>Week End</th>
            <th>Hours</th>
            <th>Notes</th>
            <th>Creator</th>
            <th>Created</th>
            <th>Updated</th>
            <th style={{ width: 260 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9}>Loading…</td>
            </tr>
          ) : timesheets.length === 0 ? (
            <tr>
              <td colSpan={9}>No timesheets found.</td>
            </tr>
          ) : (
            timesheets.map((t) => {
              const isEditingRow = editingId === t.id;
              const isCreator = t.user_id === user?.id;
              const canEdit = isAdmin || isCreator; // allow admins or creator

              return (
                <tr key={t.id}>
                  <td>
                    {isEditingRow ? (
                      <select
                        className="form-select"
                        value={editValues.project_id || ""}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            project_id: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      projectName(t.project_id)
                    )}
                  </td>

                  <td>
                    {isEditingRow ? (
                      <input
                        type="date"
                        className="form-control"
                        value={editValues.week_start || ""}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            week_start: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      toYMD(t.week_start)
                    )}
                  </td>

                  <td>
                    {isEditingRow ? (
                      <input
                        type="date"
                        className="form-control"
                        value={editValues.week_end || ""}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            week_end: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      toYMD(t.week_end)
                    )}
                  </td>

                  <td>
                    {isEditingRow ? (
                      <input
                        type="number"
                        step="0.5"
                        className="form-control"
                        value={editValues.hours_worked || ""}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            hours_worked: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      t.hours_worked ?? "-"
                    )}
                  </td>

                  <td>
                    {isEditingRow ? (
                      <textarea
                        className="form-control"
                        value={editValues.notes || ""}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            notes: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <span
                        className="text-truncate d-inline-block"
                        style={{ maxWidth: 200 }}
                        title={t.notes}
                      >
                        {t.notes || "-"}
                      </span>
                    )}
                  </td>

                  <td>{profilesById[t.user_id]}</td>
                  <td>{fmtDT(t.created_at)}</td>
                  <td>{fmtDT(t.updated_at)}</td>

                  <td>
                    {isEditingRow ? (
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-primary" onClick={saveEdit}>
                          Save
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => openView(t)}
                        >
                          View
                        </button>
                        {/* ✅ Only show Edit/Delete if NOT admin and is the creator */}
                        {!isAdmin && isCreator && (
                          <>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => startEdit(t)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(t.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
