// src/components/timesheets/TimesheetFilters.jsx
import React from "react";

export default function TimesheetFilters({
  q,
  setQ,
  projectFilter,
  setProjectFilter,
  projects,
  weekFrom,
  setWeekFrom,
  weekTo,
  setWeekTo,
  resetFilters,
}) {
  return (
    <div className="mb-4 card-body">
      <div className="row g-3 align-items-end">
        <div className="col-md-3">
          <label className="form-label">Search</label>
          <input
            className="form-control"
            placeholder="Search notes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Project</label>
          <select
            className="form-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Week Start From</label>
          <input
            type="date"
            className="form-control"
            value={weekFrom}
            onChange={(e) => setWeekFrom(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Week End To</label>
          <input
            type="date"
            className="form-control"
            value={weekTo}
            onChange={(e) => setWeekTo(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
}
