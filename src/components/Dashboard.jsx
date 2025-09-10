/* eslint-disable no-unused-vars */
// src/components/Dashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import NavDashboard from "./NavDashboard";
import TaskFilters from "./tasks/TaskFilters";
import TaskTable from "./tasks/TaskTable";
import { ViewTaskModal, AddTaskModal } from "./tasks/TaskModals";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function Dashboard({ user: userProp }) {
  const [user, setUser] = useState(userProp || null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Data
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]); // full list (for display/search)
  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Toast
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "warning",
  });
  const toastTimer = useRef(null);
  const [overdueToastShown, setOverdueToastShown] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    project_id: "",
    assign_date: "",
    due_date: "",
    status: "todo",
    description: "",
    assignee_id: "",
  });

  // VIEW MODAL
  const [viewTask, setViewTask] = useState(null);

  // ADD TASK MODAL
  const [showAddModal, setShowAddModal] = useState(false);

  // Helpers
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const showToast = (message, variant = "warning", autoHideMs = 5000) => {
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
  const statusLabel = (v) =>
    STATUS_OPTIONS.find((o) => o.value === v)?.label || v;

  // is the task overdue? (due date in the past and not done)
  const isTaskOverdue = (t) => {
    const due = toYMD(t?.due_date);
    return Boolean(due && isBefore(due, today) && t?.status !== "done");
  };

  // Lookups for user name/email
  const profilesById = useMemo(() => {
    const m = Object.create(null);
    for (const u of profiles || []) {
      const key = String(u.id);
      m[key] = (u.full_name && u.full_name.trim()) || u.email || key;
    }
    return m;
  }, [profiles]);

  const profilesEmailById = useMemo(() => {
    const m = Object.create(null);
    for (const u of profiles || []) m[String(u.id)] = u.email || "";
    return m;
  }, [profiles]);

  const userLabel = (id) => (id ? profilesById[String(id)] || "—" : "—");
  const userEmail = (id) => (id ? profilesEmailById[String(id)] || "" : ""); // ⬅️ NEW

  // Only allow selecting *my* projects (unless admin)
  const projectsForAssign = useMemo(
    () => (isAdmin ? projects : projects.filter((p) => p.user_id === user?.id)),
    [projects, isAdmin, user?.id]
  );

  // New task form state (used by Add modal)
  const [projectId, setProjectId] = useState("");
  const [assignDate, setAssignDate] = useState(today);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("todo");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // FILTERS
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [assignFrom, setAssignFrom] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [endFrom, setEndFrom] = useState("");
  const [endTo, setEndTo] = useState("");
  const resetFilters = () => {
    setQ("");
    setStatusFilter("");
    setProjectFilter("");
    setAssigneeFilter("");
    setAssignFrom("");
    setAssignTo("");
    setEndFrom("");
    setEndTo("");
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "—";

  const filteredTasks = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (tasks || []).filter((t) => {
      if (term) {
        const hay =
          (projectName(t.project_id) || "").toLowerCase() +
          " " +
          (t.description || "").toLowerCase() +
          " " +
          (userLabel(t.assignee_id) || "").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (statusFilter && t.status !== statusFilter) return false;
      if (projectFilter && t.project_id !== projectFilter) return false;
      if (assigneeFilter && t.assignee_id !== assigneeFilter) return false;

      const aDate = toYMD(t.assign_date);
      const dDate = toYMD(t.due_date);
      if (assignFrom && (!aDate || aDate < assignFrom)) return false;
      if (assignTo && (!aDate || aDate > assignTo)) return false;
      if (endFrom && (!dDate || dDate < endFrom)) return false;
      if (endTo && (!dDate || dDate > endTo)) return false;

      return true;
    });
  }, [
    tasks,
    q,
    statusFilter,
    projectFilter,
    assigneeFilter,
    assignFrom,
    assignTo,
    endFrom,
    endTo,
    projects,
    profilesById,
  ]);

  // ---------- CSV Export ----------
  function makeCSV(headers, rows) {
    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers, ...rows].map((r) => r.map(escape).join(","));
    return "\uFEFF" + lines.join("\n"); // BOM for Excel compatibility
  }

  function handleExportCSV() {
    const headers = [
      "id",
      "project_id",
      "project_name",
      "assign_date",
      "due_date",
      "status",
      "status_label",
      "assignee_id",
      "assignee_label",
      "description",
      "created_at_iso",
      "updated_at_iso",
    ];

    const rows = (filteredTasks || []).map((t) => [
      t.id,
      t.project_id || "",
      projectName(t.project_id),
      toYMD(t.assign_date) || "",
      toYMD(t.due_date) || "",
      t.status || "",
      statusLabel(t.status) || "",
      t.assignee_id || "",
      userLabel(t.assignee_id) || "",
      t.description || "",
      t.created_at ? new Date(t.created_at).toISOString() : "",
      t.updated_at ? new Date(t.updated_at).toISOString() : "",
    ]);

    const csv = makeCSV(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  // --------------------------------

  // Resolve user
  useEffect(() => {
    if (userProp) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
  }, [userProp]);

  // Load my role (admin/employee)
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

  // Load projects & profiles
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        // Include user_id so we can filter allowed projects for non-admins
        const { data: pjs } = await supabase
          .from("projects")
          .select("id,name,user_id")
          .order("created_at", { ascending: false });
        setProjects(pjs || []);
      } catch {
        setProjects([]);
      }

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true, nulls: "last" });
      setProfiles(profs || []);
      if ((profs || []).some((u) => u.id === user.id)) setAssigneeId(user.id);
    })();
  }, [user?.id]);

  // Load tasks (global reads)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      setErr("");
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("assign_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) setErr(error.message);
      else setTasks(data || []);
      setLoading(false);
    })();
  }, [user?.id]);

  // Overdue toast
  useEffect(() => {
    if (!tasks.length || overdueToastShown) return;
    const overdue = tasks.filter(
      (t) =>
        t.due_date && isBefore(toYMD(t.due_date), today) && t.status !== "done"
    );
    if (overdue.length > 0) {
      showToast(
        `You have ${overdue.length} task${
          overdue.length > 1 ? "s" : ""
        } past due.`,
        "warning"
      );
      setOverdueToastShown(true);
    }
  }, [tasks, today, overdueToastShown]);

  // Close modals on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (showAddModal) setShowAddModal(false);
        if (viewTask) setViewTask(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAddModal, viewTask]);

  // Helpers for ownership
  const canEditTask = (t) => t?.user_id === user?.id || isAdmin;

  // Create (owner by default via DB; no user_id sent)
  async function handleAddTask(e) {
    e.preventDefault();
    if (!user?.id) return;

    if (!projectId) return setErr("Please select a project.");
    if (dueDate && isBefore(dueDate, today))
      return setErr("End date cannot be in the past.");
    if (dueDate && isBefore(dueDate, assignDate))
      return setErr("End date cannot be before the assign date.");

    // Guard: non-admins can only add tasks to their own projects
    if (!isAdmin && !projectsForAssign.some((p) => p.id === projectId)) {
      const msg = "You can only add tasks to your own projects.";
      setErr(msg);
      showToast(msg, "danger");
      return;
    }

    setSubmitting(true);
    setErr("");

    const pName = projects.find((p) => p.id === projectId)?.name || "Task";

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          project_id: projectId || null,
          task_name: `${pName} - Task`,
          assign_date: assignDate || today,
          due_date: dueDate || null,
          status,
          description: description?.trim() || null,
          assignee_id: assigneeId || null,
        },
      ])
      .select()
      .single();

    if (error) setErr(error.message);
    else {
      setTasks((prev) => [data, ...prev]);
      setProjectId("");
      setAssignDate(today);
      setDueDate("");
      setStatus("todo");
      setDescription("");
      setAssigneeId(user.id || "");
      setShowAddModal(false);
      showToast("Task added.", "success");
    }

    setSubmitting(false);
  }

  // Quick status change (OWNER or ADMIN)
  async function handleChangeStatus(id, newStatus) {
    const row = tasks.find((t) => t.id === id);
    if (row && !canEditTask(row)) {
      showToast("You can only update your own task.", "warning");
      return;
    }

    const prev = tasks;
    setTasks((list) =>
      list.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      setErr(error.message);
      setTasks(prev);
    }
  }

  // Edit handlers (OWNER or ADMIN)
  function startEdit(t) {
    if (!canEditTask(t)) {
      showToast("You can only edit your own task.", "warning");
      return;
    }
    setEditingId(t.id);
    setEditValues({
      project_id: t.project_id || "",
      assign_date: toYMD(t.assign_date) || today,
      due_date: toYMD(t.due_date) || "",
      status: t.status || "todo",
      description: t.description || "",
      assignee_id: t.assignee_id || "",
    });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditValues({
      project_id: "",
      assign_date: "",
      due_date: "",
      status: "todo",
      description: "",
      assignee_id: "",
    });
  }
  async function saveEdit() {
    if (!user?.id || !editingId) return;
    const {
      project_id,
      assign_date,
      due_date,
      status,
      description,
      assignee_id,
    } = editValues;

    if (!project_id) return setErr("Please select a project.");
    if (due_date && isBefore(due_date, today))
      return setErr("End date cannot be in the past.");
    if (due_date && isBefore(due_date, assign_date))
      return setErr("End date cannot be before the assign date.");

    // Guard: non-admins can only move tasks to their own projects
    if (!isAdmin && !projectsForAssign.some((p) => p.id === project_id)) {
      const msg = "You can only move tasks to your own projects.";
      setErr(msg);
      showToast(msg, "danger");
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update({
        project_id,
        assign_date,
        due_date: due_date || null,
        status,
        description: description?.trim() || null,
        assignee_id: assignee_id || null,
      })
      .eq("id", editingId)
      .select()
      .single();

    if (error) return setErr(error.message);
    setTasks((list) => list.map((t) => (t.id === editingId ? data : t)));
    cancelEdit();
    showToast("Task updated.", "success");
  }

  // Delete (OWNER or ADMIN)
  async function handleDeleteTask(id) {
    const row = tasks.find((t) => t.id === id);
    if (row && !canEditTask(row)) {
      showToast("You can only delete your own task.", "warning");
      return;
    }
    if (!window.confirm("Delete this task? This cannot be undone.")) return;

    const prev = tasks;
    setTasks((list) => list.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setErr(error.message);
      setTasks(prev);
    } else {
      showToast("Task deleted.", "success");
    }
  }

  // Modals
  const openView = (t) => setViewTask(t);
  const closeView = () => setViewTask(null);
  const openAddModal = () => {
    setErr("");
    setProjectId("");
    setAssignDate(today);
    setDueDate("");
    setStatus("todo");
    setDescription("");
    setAssigneeId(user?.id || "");
    setShowAddModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);

  // Date mins
  const assignDateMin = undefined; // allow past
  const dueDateMin = assignDate && assignDate > today ? assignDate : today;

  return (
    <>
      <NavDashboard />

      {/* Toast */}
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

      {/* View modal */}
      <ViewTaskModal
        task={viewTask}
        onClose={closeView}
        projectName={projectName}
        statusLabel={statusLabel}
        toYMD={toYMD}
        fmtDT={fmtDT}
        userLabel={userLabel}
      />

      {/* Add modal */}
      <AddTaskModal
        show={showAddModal}
        onClose={closeAddModal}
        projects={
          projectsForAssign
        } /* filtered for current user unless admin */
        profiles={profiles}
        projectId={projectId}
        setProjectId={setProjectId}
        assignDate={assignDate}
        setAssignDate={setAssignDate}
        dueDate={dueDate}
        setDueDate={setDueDate}
        status={status}
        setStatus={setStatus}
        description={description}
        setDescription={setDescription}
        assigneeId={assigneeId}
        setAssigneeId={setAssigneeId}
        assignDateMin={assignDateMin}
        dueDateMin={dueDateMin}
        err={err}
        submitting={submitting}
        handleAddTask={handleAddTask}
        STATUS_OPTIONS={STATUS_OPTIONS}
      />

      <main className="container-fluid py-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-3">
            <h1 className="mb-0">Tasks</h1>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openAddModal}
            >
              Add task
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleExportCSV}
              disabled={loading || filteredTasks.length === 0}
              title={
                loading
                  ? "Loading tasks…"
                  : filteredTasks.length === 0
                  ? "No rows to export"
                  : "Export visible rows as CSV"
              }
            >
              Export CSV
            </button>
          </div>
          <div className="text-muted">
            {filteredTasks.length} of {tasks.length} shown
          </div>
        </div>

        {/* Filters */}
        <TaskFilters
          q={q}
          setQ={setQ}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          assigneeFilter={assigneeFilter}
          setAssigneeFilter={setAssigneeFilter}
          projects={projects} /* full list for filtering/display */
          profiles={profiles}
          resetFilters={resetFilters}
        />

        {/* Table */}
        <TaskTable
          loading={loading}
          tasks={filteredTasks}
          projects={projectsForAssign} /* restrict editing choices */
          STATUS_OPTIONS={STATUS_OPTIONS}
          projectName={projectName}
          userLabel={userLabel}
          userEmail={userEmail} /* ⬅️ NEW: for tooltip on creator */
          toYMD={toYMD}
          fmtDT={fmtDT}
          editingId={editingId}
          editValues={editValues}
          setEditValues={setEditValues}
          startEdit={startEdit}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
          handleChangeStatus={handleChangeStatus}
          handleDeleteTask={handleDeleteTask}
          openView={openView}
          isOverdue={isTaskOverdue}
          profiles={profiles} /* so Assignee dropdown lists users */
        />
      </main>
    </>
  );
}
