// src/components/AdminTimesheetTable.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminTimesheetTable() {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllTimesheets() {
      const { data, error } = await supabase
        .from("timesheets")
        .select(
          "id, week_start, hours_worked, notes, created_at, user_id, profiles(full_name, email)"
        )
        .order("week_start", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setTimesheets(data);
      }
      setLoading(false);
    }

    fetchAllTimesheets();
  }, []);

  if (loading) return <p>Loading…</p>;

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto" }}>
      <h2>All Employee Timesheets</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Email</th>
            <th>Week Start</th>
            <th>Hours Worked</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {timesheets.map((t) => (
            <tr key={t.id}>
              <td>{t.profiles?.full_name || "-"}</td>
              <td>{t.profiles?.email || "-"}</td>
              <td>{t.week_start}</td>
              <td>{t.hours_worked}</td>
              <td>{t.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
