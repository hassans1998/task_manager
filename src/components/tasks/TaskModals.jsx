// src/components/tasks/TaskModals.jsx
import React from "react";

export function ViewTaskModal({
  task,
  onClose,
  projectName,
  statusLabel,
  toYMD,
  fmtDT,
  userLabel,
}) {
  if (!task) return null;
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: "rgba(0,0,0,.45)", zIndex: 1090 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card shadow-lg position-absolute start-50 top-50 translate-middle"
        style={{
          maxWidth: 820,
          width: "92vw",
          maxHeight: "86vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">{projectName(task.project_id)}</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="text-muted small">Assign date</div>
              <div className="fw-semibold">
                {toYMD(task.assign_date) || "—"}
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-muted small">End date</div>
              <div className="fw-semibold">{toYMD(task.due_date) || "—"}</div>
            </div>

            <div className="col-md-3">
              <div className="text-muted small">Status</div>
              <div className="fw-semibold">{statusLabel(task.status)}</div>
            </div>
            <div className="col-md-9">
              <div className="text-muted small">Assignee</div>
              <div className="fw-semibold">{userLabel(task.assignee_id)}</div>
            </div>

            <div className="col-md-6">
              <div className="text-muted small">Created at</div>
              <div className="fw-semibold">{fmtDT(task.created_at)}</div>
            </div>
            <div className="col-md-6">
              <div className="text-muted small">Updated at</div>
              <div className="fw-semibold">{fmtDT(task.updated_at)}</div>
            </div>

            <div className="col-12">
              <div className="text-muted small">Description</div>
              <div
                className="border rounded p-2"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  minHeight: 80,
                }}
              >
                {task.description || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddTaskModal({
  show,
  onClose,
  projects,
  profiles,
  projectId,
  setProjectId,
  assignDate,
  setAssignDate,
  dueDate,
  setDueDate,
  status,
  setStatus,
  description,
  setDescription,
  assigneeId,
  setAssigneeId,
  assignDateMin,
  dueDateMin,
  err,
  submitting,
  handleAddTask,
  STATUS_OPTIONS,
}) {
  if (!show) return null;
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: "rgba(0,0,0,.45)", zIndex: 1090 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card shadow-lg position-absolute start-50 top-50 translate-middle"
        style={{
          maxWidth: 900,
          width: "92vw",
          maxHeight: "86vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">Add task</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="card-body">
          <form className="row g-3 align-items-end" onSubmit={handleAddTask}>
            <div className="col-md-3">
              <label className="form-label">Project</label>
              <select
                className="form-select shadow-none"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="">Select a project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Assign date</label>
              <input
                type="date"
                className="form-control shadow-none"
                value={assignDate}
                min={assignDateMin}
                onChange={(e) => setAssignDate(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">End date</label>
              <input
                type="date"
                className="form-control shadow-none"
                value={dueDate}
                min={dueDateMin}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Assign to</label>
              <select
                className="form-select shadow-none"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {profiles.map((u) => (
                  <option key={u.id} value={u.id}>
                    {(u.full_name && u.full_name.trim()) || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select shadow-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control shadow-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details…"
              />
            </div>

            {err && (
              <div className="col-12">
                <p className="text-danger my-1">{err}</p>
              </div>
            )}

            <div className="col-12 d-flex gap-2">
              <button className="btn btn-success" disabled={submitting}>
                {submitting ? "Adding…" : "Add task"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
