// src/components/tasks/TaskFilters.jsx
import React from "react";

export default function TaskFilters({
  q,
  setQ,
  projectFilter,
  setProjectFilter,
  assigneeFilter,
  setAssigneeFilter,
  projects,
  profiles,
  resetFilters,
}) {
  return (
    <div className="mb-4">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Search</label>
            <input
              className="form-control shadow-none"
              placeholder="Search project, description, assignee…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Project</label>
            <select
              className="form-select shadow-none"
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
            <label className="form-label">Assignee</label>
            <select
              className="form-select shadow-none"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="">All</option>
              {profiles.map((u) => (
                <option key={u.id} value={u.id}>
                  {(u.full_name && u.full_name.trim()) || u.email}
                </option>
              ))}
            </select>
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
    </div>
  );
}
