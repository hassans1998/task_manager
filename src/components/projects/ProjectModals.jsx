// src/components/projects/ProjectModals.jsx
import React from "react";

export function ViewProjectModal({
  project,
  onClose,
  statusLabel,
  toYMD,
  fmtDT,
}) {
  if (!project) return null;
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
          <h5 className="mb-0">{project.name}</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="text-muted small">Project ID</div>
              <div className="fw-semibold text-truncate">{project.id}</div>
            </div>
            <div className="col-md-3">
              <div className="text-muted small">Status</div>
              <div className="fw-semibold">{statusLabel(project.status)}</div>
            </div>
            <div className="col-md-3">
              <div className="text-muted small">Start date</div>
              <div className="fw-semibold">
                {toYMD(project.start_date) || "—"}
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-muted small">End date</div>
              <div className="fw-semibold">
                {toYMD(project.end_date) || "—"}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted small">Created at</div>
              <div className="fw-semibold">{fmtDT(project.created_at)}</div>
            </div>
            <div className="col-md-4">
              <div className="text-muted small">Updated at</div>
              <div className="fw-semibold">{fmtDT(project.updated_at)}</div>
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
                {project.description || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddProjectModal({
  show,
  onClose,
  STATUS_OPTIONS,
  name,
  setName,
  description,
  setDescription,
  status,
  setStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  endDateMin,
  err,
  submitting,
  handleAdd,
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
          maxWidth: 720,
          width: "92vw",
          maxHeight: "86vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">Add project</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="card-body">
          <form className="row g-3" onSubmit={handleAdd}>
            <div className="col-md-6">
              <label className="form-label">Project name</label>
              <input
                className="form-control shadow-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Revamp"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select
                className="form-select shadow-none"
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Start date</label>
              <input
                type="date"
                className="form-control shadow-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">End date</label>
              <input
                type="date"
                className="form-control shadow-none"
                value={endDate}
                min={endDateMin}
                onChange={(e) => setEndDate(e.target.value)}
              />
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

            <div className="col-12 d-flex gap-2 justify-content-end">
              <button className="btn btn-success" disabled={submitting}>
                {submitting ? "Creating…" : "Add project"}
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
