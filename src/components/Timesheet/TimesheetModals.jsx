// src/components/timesheets/TimesheetModals.jsx
import React from "react";

export function ViewTimesheetModal({
  timesheet,
  onClose,
  projectName,
  profilesById,
  toYMD,
  fmtDT,
}) {
  if (!timesheet) return null;

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
          <h5 className="mb-0">Timesheet Details</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-muted small">Project</div>
              <div className="fw-semibold">
                {projectName(timesheet.project_id)}
              </div>
            </div>

            <div className="col-md-4">
              <div className="text-muted small">Week Start</div>
              <div className="fw-semibold">{toYMD(timesheet.week_start)}</div>
            </div>

            <div className="col-md-4">
              <div className="text-muted small">Week End</div>
              <div className="fw-semibold">{toYMD(timesheet.week_end)}</div>
            </div>

            <div className="col-md-3">
              <div className="text-muted small">Hours Worked</div>
              <div className="fw-semibold">{timesheet.hours_worked ?? "-"}</div>
            </div>

            <div className="col-md-5">
              <div className="text-muted small">Created By</div>
              <div className="fw-semibold">
                {profilesById[timesheet.user_id]}
              </div>
            </div>

            <div className="col-md-4">
              <div className="text-muted small">Created At</div>
              <div className="fw-semibold">{fmtDT(timesheet.created_at)}</div>
            </div>

            <div className="col-md-4">
              <div className="text-muted small">Updated At</div>
              <div className="fw-semibold">{fmtDT(timesheet.updated_at)}</div>
            </div>

            <div className="col-12">
              <div className="text-muted small">Notes</div>
              <div
                className="border rounded p-2"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  minHeight: 80,
                }}
              >
                {timesheet.notes || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
