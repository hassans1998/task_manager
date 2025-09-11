import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function NavDashboard() {
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    let mounted = true;

    const deriveFromEmail = (email) => {
      if (!email) return "User";
      const local = email.split("@")[0];
      return local
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const pickName = async (user) => {
      if (!mounted) return;

      const metaName = user?.user_metadata?.full_name?.trim();
      if (metaName) {
        setDisplayName(metaName);
        return;
      }

      const email = user?.email;
      if (email) {
        const { data: row, error } = await supabase
          .from("signups")
          .select("full_name")
          .eq("email", email)
          .maybeSingle();

        if (!error && row?.full_name?.trim()) {
          setDisplayName(row.full_name.trim());
          return;
        }
      }

      setDisplayName(deriveFromEmail(user?.email));
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      pickName(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evt, session) => {
      pickName(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  return (
    <nav className="navbar navbar-expand bg-light border-bottom">
      <div className="container-fluid">
        <Link to="/dashboard" className="navbar-brand mb-0 h1">
          {displayName}
        </Link>

        <ul className="navbar-nav mx-auto">
          <li className="nav-item">
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Projects
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Tasks
            </NavLink>
          </li>
        </ul>

        <div className="ms-auto">
          <button className="btn btn-outline-danger" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
