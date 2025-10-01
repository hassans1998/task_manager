// src/components/timesheets/TimesheetModals.jsx
import React, { useState, useEffect } from "react";

export function AddTimesheetModal({ show, onClose, handleAdd, projects, err }) {
  const today = new Date().toISOString().slice(0, 10);
  const [projectId, setProjectId] = useState("");
  const [weekStart, setWeekStart] = useState(today);
  const [weekEnd, setWeekEnd] = useState(today);
  const [hoursWorked, setHoursWorked] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  // Reset form whenever modal is shown
  useEffect(() => {
    if (show) {
      setProjectId("");
      setWeekStart(today);
      setWeekEnd(today);
      setHoursWorked("");
      setNotes("");
      setLocalError("");
      setSubmitting(false);
    }
  }, [show]);

  if (!show) return null;

  async function submitForm(e) {
    e.preventDefault();
    setLocalError("");

    if (!projectId) return setLocalError("⚠️ Please select a project.");
    if (!weekStart || !weekEnd)
      return setLocalError("⚠️ Please select week dates.");
    if (weekEnd < weekStart)
      return setLocalError("⚠️ Week end cannot be before week start.");

    setSubmitting(true);

    const payload = {
      project_id: projectId,
      week_start: weekStart,
      week_end: weekEnd,
      hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
      notes: notes.trim() || null,
    };

    try {
      const success = await handleAdd(payload);
      if (success !== false) {
        onClose();
      } else {
        setLocalError("❌ Failed to add timesheet. Please try again.");
      }
    } catch (e) {
      setLocalError(e.message || "❌ Unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

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
          <h5 className="mb-0">Add Timesheet</h5>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
        </div>
        <div className="card-body">
          <form className="row g-3" onSubmit={submitForm}>
            {/* Project */}
            <div className="col-md-6">
              <label className="form-label">Project</label>
              <select
                className="form-select shadow-none"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hours */}
            <div className="col-md-6">
              <label className="form-label">Hours Worked</label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="form-control shadow-none"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="e.g. 40"
              />
            </div>

            {/* Week Start */}
            <div className="col-md-6">
              <label className="form-label">Week Start</label>
              <input
                type="date"
                className="form-control shadow-none"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                required
              />
            </div>

            {/* Week End */}
            <div className="col-md-6">
              <label className="form-label">Week End</label>
              <input
                type="date"
                className="form-control shadow-none"
                value={weekEnd}
                min={weekStart}
                onChange={(e) => setWeekEnd(e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div className="col-12">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control shadow-none"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional details…"
              />
            </div>

            {/* Errors */}
            {(localError || err) && (
              <div className="col-12">
                <p className="text-danger my-1">{localError || err}</p>
              </div>
            )}

            {/* Actions */}
            <div className="col-12 d-flex gap-2 justify-content-end">
              <button
                type="submit"
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Add Timesheet"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={submitting}
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
