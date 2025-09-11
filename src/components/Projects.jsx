// src/components/Projects.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import NavDashboard from "./NavDashboard";
import ProjectFilters from "./projects/ProjectFilters";
import ProjectTable from "./projects/ProjectTable";
import { ViewProjectModal, AddProjectModal } from "./projects/ProjectModals";

const STATUS_OPTIONS = [
  { value: 1, label: "In progress" },
  { value: 2, label: "Review" },
  { value: 3, label: "Testing" },
  { value: 4, label: "Complete" },
];

function statusLabel(v) {
  const opt = STATUS_OPTIONS.find((o) => Number(o.value) === Number(v));
  return opt ? opt.label : v;
}

export default function Projects({ user: userProp }) {
  const [user, setUser] = useState(userProp || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projects, setProjects] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Toast
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "success",
  });
  const toastTimer = useRef(null);
  const showToast = (message, variant = "success", autoHideMs = 4000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, message, variant });
    if (autoHideMs) {
      toastTimer.current = setTimeout(
        () => setToast((t) => ({ ...t, show: false })),
        autoHideMs
      );
    }
  };
  const closeToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((t) => ({ ...t, show: false }));
  };

  // Helpers
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isBefore = (a, b) => a && b && a < b;
  const toYMD = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v.includes("T") ? v.slice(0, 10) : v;
    try {
      return new Date(v).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };
  const fmtDT = (ts) => {
    if (!ts) return "-";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const isProjectOverdue = (p) => {
    const end = toYMD(p?.end_date);
    return Boolean(end && isBefore(end, today) && Number(p?.status) !== 4);
  };

  // Lookups for creator name + email
  const profilesById = useMemo(() => {
    const m = Object.create(null);
    for (const u of profiles || []) {
      const key = String(u.id);
      m[key] = (u.full_name && u.full_name.trim()) || u.email || key;
    }
    return m;
  }, [profiles]);

  const emailsById = useMemo(() => {
    const m = Object.create(null);
    for (const u of profiles || []) m[String(u.id)] = u.email || "";
    return m;
  }, [profiles]);

  const userLabel = (id) => (id ? profilesById[String(id)] || "—" : "—");
  const userEmail = (id) => (id ? emailsById[String(id)] || "" : "");

  // --- CSV export helpers ---
  function makeCSV(headers, rows) {
    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers, ...rows].map((r) => r.map(escape).join(","));
    return "\uFEFF" + lines.join("\n");
  }
  function handleExportCSV() {
    const headers = [
      "id",
      "name",
      "description",
      "status",
      "status_label",
      "start_date",
      "end_date",
      "created_at_iso",
      "updated_at_iso",
    ];
    const rows = (filteredProjects || []).map((p) => [
      p.id,
      p.name || "",
      p.description || "",
      p.status ?? "",
      statusLabel(p.status) || "",
      toYMD(p.start_date) || "",
      toYMD(p.end_date) || "",
      p.created_at ? new Date(p.created_at).toISOString() : "",
      p.updated_at ? new Date(p.updated_at).toISOString() : "",
    ]);
    const csv = makeCSV(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(1);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    name: "",
    description: "",
    status: 1,
    start_date: today,
    end_date: "",
  });

  const [viewProject, setViewProject] = useState(null);

  // Filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [endFrom, setEndFrom] = useState("");
  const [endTo, setEndTo] = useState("");
  const resetFilters = () => {
    setQ("");
    setStatusFilter("");
    setStartFrom("");
    setStartTo("");
    setEndFrom("");
    setEndTo("");
  };

  const filteredProjects = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (projects || []).filter((p) => {
      if (term) {
        const hay =
          (p.name || "").toLowerCase() +
          " " +
          (p.description || "").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (statusFilter !== "" && Number(p.status) !== Number(statusFilter))
        return false;

      const pStart = toYMD(p.start_date);
      if (startFrom && (!pStart || pStart < startFrom)) return false;
      if (startTo && (!pStart || pStart > startTo)) return false;

      const pEnd = toYMD(p.end_date);
      if (endFrom && (!pEnd || pEnd < endFrom)) return false;
      if (endTo && (!pEnd || pEnd > endTo)) return false;

      return true;
    });
  }, [projects, q, statusFilter, startFrom, startTo, endFrom, endTo]);

  useEffect(() => {
    if (userProp) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
  }, [userProp]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", user.id)
        .single();
      setIsAdmin(!error && data?.user_role === "admin");
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      setErr("");
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) setErr(error.message);
      else setProjects(data || []);
      setLoading(false);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true, nulls: "last" });
      setProfiles(data || []);
    })();
  }, [user?.id]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!user?.id) return;

    if (!isAdmin) {
      setErr("Only admins can create projects.");
      showToast("Only admins can create projects.", "danger");
      return;
    }

    if (!name.trim()) return setErr("Please enter a project name.");
    if (endDate && isBefore(endDate, startDate))
      return setErr("End date cannot be before the start date.");

    setSubmitting(true);
    setErr("");

    const payload = {
      name: name.trim(),
      description: description?.trim() || null,
      status: Number(status),
      start_date: startDate || today,
      end_date: endDate || null,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert([payload])
      .select()
      .single();

    if (error) {
      setErr(error.message);
      showToast(error.message, "danger");
    } else {
      setProjects((prev) => [data, ...prev]);
      setName("");
      setDescription("");
      setStatus(1);
      setStartDate(today);
      setEndDate("");
      setShowAddModal(false);
      showToast("Project created.", "success");
    }
    setSubmitting(false);
  }

  function startEdit(p) {
    if (!isAdmin) {
      showToast("Only admins can edit projects.", "warning");
      return;
    }
    setEditingId(p.id);
    setEditValues({
      name: p.name || "",
      description: p.description || "",
      status: Number(p.status) || 1,
      start_date: toYMD(p.start_date) || today,
      end_date: toYMD(p.end_date) || "",
    });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditValues({
      name: "",
      description: "",
      status: 1,
      start_date: today,
      end_date: "",
    });
  }
  async function saveEdit() {
    if (!user?.id || !editingId) return;
    if (!isAdmin) {
      showToast("Only admins can edit projects.", "warning");
      return;
    }
    const { name, description, status, start_date, end_date } = editValues;
    if (!name.trim()) return setErr("Please enter a project name.");
    if (end_date && isBefore(end_date, start_date))
      return setErr("End date cannot be before the start date.");

    const update = {
      name: name.trim(),
      description: description?.trim() || null,
      status: Number(status),
      start_date,
      end_date: end_date || null,
    };

    const { data, error } = await supabase
      .from("projects")
      .update(update)
      .eq("id", editingId)
      .select()
      .single();

    if (error) {
      setErr(error.message);
      showToast(error.message, "danger");
      return;
    }
    setProjects((list) => list.map((p) => (p.id === editingId ? data : p)));
    cancelEdit();
    showToast("Project updated.", "success");
  }

  async function handleDelete(id) {
    if (!isAdmin) {
      showToast("Only admins can delete projects.", "warning");
      return;
    }
    if (!window.confirm("Delete this project? This cannot be undone.")) return;

    const prev = projects;
    setProjects((list) => list.filter((p) => p.id !== id));
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      setErr(error.message);
      setProjects(prev);
      showToast(error.message, "danger");
    } else {
      showToast("Project deleted.", "success");
    }
  }

  const openAddModal = () => {
    setErr("");
    if (!isAdmin) {
      showToast("Only admins can create projects.", "warning");
      return;
    }
    setName("");
    setDescription("");
    setStatus(1);
    setStartDate(today);
    setEndDate("");
    setShowAddModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);
  const openView = (p) => setViewProject(p);
  const closeView = () => setViewProject(null);

  const endDateMin = startDate || today;
  const editEndMin = editValues.start_date || today;

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (showAddModal) setShowAddModal(false);
        if (viewProject) setViewProject(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAddModal, viewProject]);

  return (
    <>
      <NavDashboard />

      {toast.show && (
        <div
          className={`alert alert-${toast.variant} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`}
          role="alert"
          style={{ zIndex: 1080, minWidth: 320, maxWidth: "90vw" }}
        >
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div>{toast.message}</div>
            <button
              type="button"
              className="btn-close"
              onClick={closeToast}
              aria-label="Close"
            />
          </div>
        </div>
      )}

      <ViewProjectModal
        project={viewProject}
        onClose={closeView}
        statusLabel={statusLabel}
        toYMD={toYMD}
        fmtDT={fmtDT}
      />

      <AddProjectModal
        show={showAddModal}
        onClose={closeAddModal}
        STATUS_OPTIONS={STATUS_OPTIONS}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        status={status}
        setStatus={setStatus}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        endDateMin={endDateMin}
        err={err}
        submitting={submitting}
        handleAdd={handleAdd}
      />

      <main className="container-fluid py-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-3">
            <h1 className="mb-0">Projects</h1>

            {isAdmin && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openAddModal}
              >
                Add project
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleExportCSV}
              disabled={loading || filteredProjects.length === 0}
              title={
                loading
                  ? "Loading projects…"
                  : filteredProjects.length === 0
                  ? "No rows to export"
                  : "Export visible rows as CSV"
              }
            >
              Export CSV
            </button>
          </div>
          <div className="text-muted">
            {filteredProjects.length} of {projects.length} shown
          </div>
        </div>

        <ProjectFilters
          q={q}
          setQ={setQ}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          startFrom={startFrom}
          setStartFrom={setStartFrom}
          startTo={startTo}
          setStartTo={setStartTo}
          endFrom={endFrom}
          setEndFrom={setEndFrom}
          endTo={endTo}
          setEndTo={setEndTo}
          resetFilters={resetFilters}
          STATUS_OPTIONS={STATUS_OPTIONS}
        />

        <ProjectTable
          loading={loading}
          projects={filteredProjects}
          STATUS_OPTIONS={STATUS_OPTIONS}
          statusLabel={statusLabel}
          toYMD={toYMD}
          fmtDT={fmtDT}
          editingId={editingId}
          editValues={editValues}
          setEditValues={setEditValues}
          startEdit={startEdit}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
          handleDelete={handleDelete}
          openView={openView}
          editEndMin={editEndMin}
          isOverdue={isProjectOverdue}
          userLabel={userLabel}
          userEmail={userEmail}
          isAdmin={isAdmin}
        />
      </main>
    </>
  );
}
