/* eslint-disable no-unused-vars */
// src/components/projects/ProjectFilters.jsx
import React from "react";

export default function ProjectFilters({
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  startFrom,
  setStartFrom,
  startTo,
  setStartTo,
  endFrom,
  setEndFrom,
  endTo,
  setEndTo,
  resetFilters,
  STATUS_OPTIONS,
}) {
  return (
    <div className="mb-4">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Search</label>
            <input
              className="form-control shadow-none"
              placeholder="Search name or description…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {/* <div className="col-md-2">
            <label className="form-label">Status</label>
            <select
              className="form-select shadow-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Start date (from)</label>
            <input
              type="date"
              className="form-control shadow-none"
              value={startFrom}
              onChange={(e) => setStartFrom(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Start date (to)</label>
            <input
              type="date"
              className="form-control shadow-none"
              value={startTo}
              onChange={(e) => setStartTo(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">End date (from)</label>
            <input
              type="date"
              className="form-control shadow-none"
              value={endFrom}
              onChange={(e) => setEndFrom(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">End date (to)</label>
            <input
              type="date"
              className="form-control shadow-none"
              value={endTo}
              onChange={(e) => setEndTo(e.target.value)}
            />
          </div> */}
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
