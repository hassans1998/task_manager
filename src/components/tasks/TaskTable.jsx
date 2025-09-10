// src/components/tasks/TaskTable.jsx
import React from "react";

export default function TaskTable({
  loading,
  tasks,
  projects,
  STATUS_OPTIONS,
  projectName,
  userLabel,
  userEmail, // ⬅️ NEW: for creator email tooltip
  toYMD,
  fmtDT,
  editingId,
  editValues,
  setEditValues,
  startEdit,
  cancelEdit,
  saveEdit,
  handleChangeStatus,
  handleDeleteTask,
  openView,
  isOverdue, // used to color the project column
  profiles, // list of users for the Assignee dropdown
}) {
  // Date mins for edit row
  const editAssignMin = undefined;
  const editDueMin =
    editValues.assign_date && editValues.assign_date > toYMD(new Date())
      ? editValues.assign_date
      : toYMD(new Date());

  return (
    <div className="table-responsive">
      <table className="table table-striped align-middle table-bordered">
        <thead>
          <tr>
            <th>Project</th>
            <th>Creator</th> {/* ⬅️ NEW */}
            <th>Assign date</th>
            <th>End date</th>
            <th>Status</th>
            <th>Assignee</th>
            <th>Description</th>
            <th>Created at</th>
            <th>Updated at</th>
            <th style={{ width: 260 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={10}>Loading…</td> {/* 10 visible columns */}
            </tr>
          ) : tasks.length === 0 ? (
            <tr>
              <td colSpan={10}>No matching tasks.</td>
            </tr>
          ) : (
            tasks.map((t) => {
              const isEditing = editingId === t.id;
              const overdue = isOverdue?.(t);

              return (
                <tr key={t.id}>
                  {/* Project (turn red if overdue) */}
                  <td>
                    {isEditing ? (
                      <select
                        className="form-select form-select-sm shadow-none"
                        value={editValues.project_id}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            project_id: e.target.value,
                          }))
                        }
                        required
                      >
                        <option value="">Select a project…</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={overdue ? "text-danger fw-semibold" : ""}
                        title={
                          overdue
                            ? "Overdue — update due date or mark as done"
                            : undefined
                        }
                      >
                        {projectName(t.project_id)}
                      </span>
                    )}
                  </td>

                  {/* Creator (task owner) */}
                  <td>
                    <span title={userEmail?.(t.user_id)}>
                      {userLabel?.(t.user_id)}
                    </span>
                  </td>

                  {/* Assign date */}
                  <td>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-control form-control-sm shadow-none"
                        value={editValues.assign_date}
                        min={editAssignMin}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            assign_date: e.target.value,
                          }))
                        }
                        required
                      />
                    ) : (
                      toYMD(t.assign_date) ?? "-"
                    )}
                  </td>

                  {/* End date */}
                  <td>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-control form-control-sm shadow-none"
                        value={editValues.due_date}
                        min={editDueMin}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            due_date: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      toYMD(t.due_date) ?? "-"
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    {isEditing ? (
                      <select
                        className="form-select form-select-sm shadow-none"
                        value={editValues.status}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            status: e.target.value,
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
                      <select
                        className="form-select form-select-sm shadow-none"
                        value={t.status}
                        onChange={(e) =>
                          handleChangeStatus(t.id, e.target.value)
                        }
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Assignee */}
                  <td>
                    {isEditing ? (
                      <select
                        className="form-select form-select-sm shadow-none"
                        value={editValues.assignee_id || ""} // keep controlled
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            assignee_id: e.target.value || "",
                          }))
                        }
                      >
                        <option value="">Unassigned</option>
                        {(profiles || []).map((u) => {
                          const label =
                            (u.full_name && u.full_name.trim()) ||
                            u.email ||
                            u.id;
                          return (
                            <option key={u.id} value={u.id}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      userLabel(t.assignee_id)
                    )}
                  </td>

                  {/* Description */}
                  <td style={{ maxWidth: 280 }}>
                    {isEditing ? (
                      <textarea
                        className="form-control form-control-sm shadow-none"
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
                    ) : (
                      <span
                        className="text-truncate d-inline-block"
                        style={{ maxWidth: 260 }}
                      >
                        {t.description || "—"}
                      </span>
                    )}
                  </td>

                  {/* Timestamps */}
                  <td>{fmtDT(t.created_at)}</td>
                  <td>{fmtDT(t.updated_at)}</td>

                  {/* Actions */}
                  <td>
                    {isEditing ? (
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
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteTask(t.id)}
                        >
                          Delete
                        </button>
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
