import { supabase } from "./supabaseClient";

/** Current session + profile */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getMyProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, user_role")
    .eq("id", session.user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function isAdmin() {
  const profile = await getMyProfile();
  return profile?.user_role === "admin";
}

/** READ: now global (no user_id filter) */
export async function fetchAllProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function fetchAllTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Optional: “my stuff” views still work if you want them */
export async function fetchMyProjects() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function fetchMyTasks() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchTasksByProject(projectId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** CREATE: don’t send user_id; DB sets it via default/RLS */
export async function createProject(input: {
  name: string;
  description?: string | null;
  status?: number; // 1..4
  start_date?: string | null; // 'YYYY-MM-DD'
  end_date?: string | null;
}) {
  // Optional UX gate (RLS enforces anyway)
  if (!(await isAdmin())) throw new Error("Only admins can create projects.");
  const { data, error } = await supabase
    .from("projects")
    .insert([input])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createTask(input: {
  title: string;
  project_id?: string | null;
  description?: string | null;
  status?: number; // 1..4
  start_date?: string | null; // 'YYYY-MM-DD'
  due_date?: string | null;
}) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([input])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** UPDATE / DELETE: allowed for owners or admins. Handle errors for non-owners. */
export async function updateProject(
  id: string,
  patch: Partial<{
    name: string;
    description: string | null;
    status: number;
    start_date: string | null;
    end_date: string | null;
  }>
) {
  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: number;
    start_date: string | null;
    due_date: string | null;
    project_id: string | null;
  }>
) {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

/** Realtime (optional): listen to inserts/updates/deletes for live UI */
export function subscribeTasks(onChange: (payload: any) => void) {
  const channel = supabase
    .channel("realtime:tasks")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks" },
      onChange
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeProjects(onChange: (payload: any) => void) {
  const channel = supabase
    .channel("realtime:projects")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "projects" },
      onChange
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
