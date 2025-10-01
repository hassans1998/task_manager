/* eslint-disable no-unused-vars */
// src/components/Timesheets.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import NavDashboard from "./NavDashboard";
import TimesheetFilters from "./Timesheet/TimesheetFilters";
import TimesheetTable from "./Timesheet/TimesheetTable";
import { ViewTimesheetModal } from "./Timesheet/TimesheetModals";
import { AddTimesheetModal } from "./Timesheet/AddTimesheetModal";

export default function Timesheet({ user: userProp }) {
  const [user, setUser] = useState(userProp || null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Toast system
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
  const toYMD = (v) => (!v ? "" : new Date(v).toISOString().slice(0, 10));
  const fmtDT = (ts) => (!ts ? "-" : new Date(ts).toLocaleString());

  // Lookups
  const profilesById = useMemo(() => {
    const m = {};
    for (const u of profiles) {
      m[u.id] = u.full_name || u.email || u.id;
    }
    return m;
  }, [profiles]);

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "—";

  // --- CSV export ---
  function makeCSV(headers, rows) {
    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return (
      "\uFEFF" +
      [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n")
    );
  }
  function handleExportCSV() {
    const headers = [
      "id",
      "project",
      "week_start",
      "week_end",
      "hours_worked",
      "notes",
      "created_at",
      "updated_at",
    ];
    const rows = timesheets.map((t) => [
      t.id,
      projectName(t.project_id),
      toYMD(t.week_start),
      toYMD(t.week_end),
      t.hours_worked ?? "",
      t.notes || "",
      t.created_at,
      t.updated_at,
    ]);
    const csv = makeCSV(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // --- Add/Edit/View modals ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    project_id: "",
    week_start: "",
    week_end: "",
    hours_worked: "",
    notes: "",
  });
  const [viewTimesheet, setViewTimesheet] = useState(null);

  // Filters
  const [q, setQ] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [weekFrom, setWeekFrom] = useState("");
  const [weekTo, setWeekTo] = useState("");
  const resetFilters = () => {
    setQ("");
    setProjectFilter("");
    setWeekFrom("");
    setWeekTo("");
  };

  const filteredTimesheets = useMemo(() => {
    const term = q.trim().toLowerCase();
    return timesheets.filter((t) => {
      if (term) {
        const hay = (
          projectName(t.project_id) +
          " " +
          (t.notes || "")
        ).toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (projectFilter && t.project_id !== projectFilter) return false;
      if (weekFrom && (!t.week_start || toYMD(t.week_start) < weekFrom))
        return false;
      if (weekTo && (!t.week_end || toYMD(t.week_end) > weekTo)) return false;
      return true;
    });
  }, [timesheets, q, projectFilter, weekFrom, weekTo]);

  // --- Load data ---
  useEffect(() => {
    if (userProp) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
  }, [userProp]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", user.id)
        .single();
      setIsAdmin(data?.user_role === "admin");
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const { data: tData } = await supabase
        .from("timesheets")
        .select("*")
        .order("week_start", { ascending: false });
      setTimesheets(tData || []);
      setLoading(false);
    })();
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      setProfiles(profs || []);
      const { data: pjs } = await supabase.from("projects").select("id, name");
      setProjects(pjs || []);
    })();
  }, []);

  // --- CRUD ---
  async function handleAdd(payload) {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("timesheets")
      .insert([payload])
      .select()
      .single();
    if (error) return showToast(error.message, "danger");
    setTimesheets((prev) => [data, ...prev]);
    setShowAddModal(false);
    showToast("Timesheet created.", "success");
  }

  function startEdit(t) {
    if (isAdmin || t.user_id !== user?.id)
      return showToast("Only creator can edit.", "warning");
    setEditingId(t.id);
    setEditValues({
      project_id: t.project_id || "",
      week_start: toYMD(t.week_start) || "",
      week_end: toYMD(t.week_end) || "",
      hours_worked: t.hours_worked || "",
      notes: t.notes || "",
    });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditValues({
      project_id: "",
      week_start: "",
      week_end: "",
      hours_worked: "",
      notes: "",
    });
  }
  async function saveEdit() {
    const { data, error } = await supabase
      .from("timesheets")
      .update(editValues)
      .eq("id", editingId)
      .select()
      .single();
    if (error) return showToast(error.message, "danger");
    setTimesheets((list) => list.map((t) => (t.id === editingId ? data : t)));
    cancelEdit();
    showToast("Timesheet updated.", "success");
  }
  async function handleDelete(id) {
    const row = timesheets.find((t) => t.id === id);
    if (row.user_id !== user?.id)
      return showToast("Only creator can delete.", "warning");
    if (!window.confirm("Delete this timesheet?")) return;
    const prev = timesheets;
    setTimesheets((list) => list.filter((t) => t.id !== id));
    const { error } = await supabase.from("timesheets").delete().eq("id", id);
    if (error) {
      setTimesheets(prev);
      showToast(error.message, "danger");
    } else showToast("Timesheet deleted.", "success");
  }

  return (
    <>
      <NavDashboard />
      {toast.show && (
        <div
          className={`alert alert-${toast.variant} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`}
          style={{ zIndex: 1080 }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>{toast.message}</div>
            <button className="btn-close" onClick={closeToast} />
          </div>
        </div>
      )}

      <ViewTimesheetModal
        timesheet={viewTimesheet}
        onClose={() => setViewTimesheet(null)}
        projectName={projectName}
        fmtDT={fmtDT}
        toYMD={toYMD}
        profilesById={profilesById}
      />

      <AddTimesheetModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        handleAdd={handleAdd}
        projects={projects}
        err={err}
      />

      <main className="container-fluid py-5">
        <div className="d-flex justify-content-between mb-3">
          <div className="d-flex gap-3 align-items-center">
            <h1 className="mb-0">Timesheets</h1>
            {!isAdmin && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                Add timesheet
              </button>
            )}
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleExportCSV}
              disabled={loading || filteredTimesheets.length === 0}
            >
              Export CSV
            </button>
          </div>
          <div className="text-muted">
            {filteredTimesheets.length} of {timesheets.length} shown
          </div>
        </div>

        <TimesheetFilters
          q={q}
          setQ={setQ}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          projects={projects}
          weekFrom={weekFrom}
          setWeekFrom={setWeekFrom}
          weekTo={weekTo}
          setWeekTo={setWeekTo}
          resetFilters={resetFilters}
        />

        <TimesheetTable
          loading={loading}
          timesheets={filteredTimesheets}
          projects={projects} 
          projectName={projectName}
          toYMD={toYMD}
          fmtDT={fmtDT}
          editingId={editingId}
          editValues={editValues}
          setEditValues={setEditValues}
          startEdit={startEdit}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
          handleDelete={handleDelete}
          openView={setViewTimesheet}
          profilesById={profilesById}
          user={user}
          isAdmin={isAdmin}
        />
      </main>
    </>
  );
}
