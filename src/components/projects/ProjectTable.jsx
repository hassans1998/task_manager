// src/components/projects/ProjectTable.jsx
import React from "react";

export default function ProjectTable({
  loading,
  projects,
  STATUS_OPTIONS,
  statusLabel,
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
  editEndMin,
  isOverdue,
  userLabel,
  userEmail,
  isAdmin,
}) {
  return (
    <div className="table-responsive">
      <table className="table table-striped align-middle table-bordered">
        <thead>
          <tr>
            <th>Project name</th>
            <th>Creator</th>
            <th>Status</th>
            <th>Start date</th>
            <th>End date</th>
            <th>Created at</th>
            <th>Updated at</th>
            <th style={{ width: 260 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8}>Loading…</td>
            </tr>
          ) : projects.length === 0 ? (
            <tr>
              <td colSpan={8}>No matching projects.</td>
            </tr>
          ) : (
            projects.map((p) => {
              const isEditingRow = editingId === p.id && isAdmin;
              const overdue = isOverdue?.(p);

              return (
                <tr key={p.id}>
                  <td>
                    {isEditingRow ? (
                      <>
                        <input
                          className="form-control shadow-none mb-2"
                          value={editValues.name}
                          onChange={(e) =>
                            setEditValues((v) => ({
                              ...v,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Project name"
                        />
                        <textarea
                          className="form-control shadow-none"
                          rows={2}
                          value={editValues.description}
                          onChange={(e) =>
                            setEditValues((v) => ({
                              ...v,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Description (optional)"
                        />
                      </>
                    ) : (
                      <>
                        <div
                          className={`fw-semibold ${
                            overdue ? "text-danger" : ""
                          }`}
                          title={
                            overdue
                              ? "Overdue — update end date or mark complete"
                              : undefined
                          }
                        >
                          {p.name}
                        </div>
                        {p.description && (
                          <div
                            className="small text-muted text-truncate"
                            style={{ maxWidth: 360 }}
                          >
                            {p.description}
                          </div>
                        )}
                      </>
                    )}
                  </td>

                  <td>
                    <span title={userEmail?.(p.user_id)}>
                      {userLabel?.(p.user_id)}
                    </span>
                  </td>

                  <td>
                    {isEditingRow ? (
                      <select
                        className="form-select shadow-none"
                        value={editValues.status}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            status: Number(e.target.value),
                          }))
                        }
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      statusLabel(p.status)
                    )}
                  </td>

                  <td>
                    {isEditingRow ? (
                      <input
                        type="date"
                        className="form-control shadow-none"
                        value={editValues.start_date}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            start_date: e.target.value,
                          }))
                        }
                        required
                      />
                    ) : (
                      toYMD(p.start_date) || "-"
                    )}
                  </td>

                  <td>
                    {isEditingRow ? (
                      <input
                        type="date"
                        className="form-control shadow-none"
                        value={editValues.end_date}
                        min={editEndMin}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            end_date: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      toYMD(p.end_date) || "-"
                    )}
                  </td>

                  <td>{fmtDT(p.created_at)}</td>
                  <td>{fmtDT(p.updated_at)}</td>

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
                          onClick={() => openView(p)}
                        >
                          View
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => startEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(p.id)}
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
