import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

// PUBLIC_INTERFACE
/**
 * Page for users to log/update arrival/departure.
 * Shows all camp members' status in a table with color-coded status.
 * Enables real-time crew status and site population tracking.
 */
function ArrivalDeparture() {
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [myArr, setMyArr] = useState("");
  const [myDep, setMyDep] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // crewStatus function for color and text
  function computeStatus(arrive, depart) {
    const now = new Date();
    if (!arrive) return { label: "No Data", color: "#aaa" };
    const arr = new Date(arrive);
    const dep = depart ? new Date(depart) : null;
    if (dep && now > dep) return { label: "Departed", color: "#72604e" };
    if (now < arr) return { label: "Pending", color: "#fab006" };
    if (!dep || now < dep) return { label: "On Site", color: "#32cd7e" };
    return { label: "Unknown", color: "#aaa" };
  }

  // Fetch all arrival/departure sessions and member emails for dashboard display
  useEffect(() => {
    let isMounted = true;
    async function fetchAttendance() {
      setLoading(true);
      // Assuming a table named "arrivals" keyed by user_id
      let { data: arrs, error: arrErr } = await supabase
        .from("arrivals")
        .select("id, user_id, arrival, departure");

      // members table for roster (for name/email display)
      let { data: membs, error: memErr } = await supabase
        .from("members")
        .select("id, email, name");

      if (isMounted) {
        if (arrErr || memErr) {
          setError("Unable to load camp roster or arrivals.");
        } else {
          setSessions(arrs || []);
          setMembers(membs || []);
          // Set my own if present
          if (user) {
            const mine = arrs.find(e => e.user_id === user.id);
            setMyArr(mine?.arrival || "");
            setMyDep(mine?.departure || "");
          }
        }
        setLoading(false);
      }
    }
    fetchAttendance();
    // Subscribe to real-time updates if needed (optional for this version)
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  // Save/update own dates
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaveStatus("");
    if (!user) {
      setError("Must be logged in.");
      setSaving(false);
      return;
    }
    // Upsert row with user_id as key
    const { error } = await supabase
      .from("arrivals")
      .upsert({
        user_id: user.id,
        arrival: myArr,
        departure: myDep
      }, { onConflict: ["user_id"] });
    if (error) setError("Failed to save: " + error.message);
    else setSaveStatus("Saved!");
    setSaving(false);
  }

  // Count on-site & arrivals
  const now = new Date();
  let onsite = 0, arriving = 0, departed = 0;
  sessions.forEach(s => {
    const arr = s.arrival ? new Date(s.arrival) : null;
    const dep = s.departure ? new Date(s.departure) : null;
    if (!arr) return;
    if (dep && now > dep) departed++;
    else if (arr && now >= arr && (!dep || now < dep)) onsite++;
    else if (arr && now < arr) arriving++;
  });

  // For fast member lookup
  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m; });

  return (
    <section className="container" style={{ maxWidth: 840, margin: "auto" }}>
      <h1>Arrivals & Departures</h1>
      <p>Log your arrival/departure dates and see current camp attendance. Status auto-updates for all!</p>
      {!isAuthenticated ? (
        <div style={{ color: "#a00", padding: 16 }}>
          Please login to submit your arrival/departure data.
        </div>
      ) : (
        <form onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            marginBottom: 32,
            flexWrap: "wrap"
          }}
        >
          <label>
            My Arrival:
            <input
              type="datetime-local"
              required
              value={myArr}
              onChange={e => setMyArr(e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </label>
          <label>
            My Departure:
            <input
              type="datetime-local"
              value={myDep}
              onChange={e => setMyDep(e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </label>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          {saveStatus && <span style={{ color: "#278142" }}>{saveStatus}</span>}
          {error && <span style={{ color: "#a00" }}>{error}</span>}
        </form>
      )}

      <div style={{
        margin: "24px 0 14px 0",
        display: "flex",
        gap: 24,
        fontWeight: 500,
        fontSize: 19
      }}>
        <span>
          <span style={{
            background: "#48d165", color: "#fff", padding: "0.3em 0.85em", borderRadius: 18,
            boxShadow: "0 2px 8px rgba(55,80,65,0.09)", marginRight: 9
          }}>{onsite}</span>
          On Site
        </span>
        <span>
          <span style={{
            background: "#fab006", color: "#fff", padding: "0.3em 0.85em", borderRadius: 18,
            boxShadow: "0 2px 8px rgba(110,90,45,0.10)", marginRight: 9
          }}>{arriving}</span>
          En Route
        </span>
        <span>
          <span style={{
            background: "#72604e", color: "#fff", padding: "0.3em 0.85em", borderRadius: 18,
            boxShadow: "0 2px 8px rgba(70,60,55,0.12)", marginRight: 9
          }}>{departed}</span>
          Departed
        </span>
      </div>
      <div style={{ marginBottom: 18, color: "#555", fontSize: 14 }}>
        Live camp population based on crew data
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "var(--bg-secondary)",
          borderRadius: 10
        }}>
          <thead>
            <tr style={{ background: "#f1f0f6" }}>
              <th style={{ padding: "10px 6px" }}>Name</th>
              <th>Email</th>
              <th>Arrival</th>
              <th>Departure</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => {
              const memb = memberMap[s.user_id] || {};
              const st = computeStatus(s.arrival, s.departure);
              let style = { color: "#fff", background: st.color, borderRadius: 20, padding: "2px 14px", fontWeight: 600 };
              return (
                <tr key={s.user_id}>
                  <td>{memb.name || <span style={{ color: "#bbb" }}>?</span>}</td>
                  <td>{memb.email}</td>
                  <td>{s.arrival ? (new Date(s.arrival)).toLocaleString() : "-"}</td>
                  <td>{s.departure ? (new Date(s.departure)).toLocaleString() : "-"}</td>
                  <td>
                    <span style={style}>{st.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {loading && <div style={{ fontSize: 18, color: "#aaa", marginTop: 10 }}>Loading...</div>}
      </div>
      <p style={{ marginTop: 16, color: "#5d5181", fontWeight: 500 }}>
        <strong>Note:</strong> Crew status auto-colors based on real-time dates. Update yours anytime!
      </p>
    </section>
  );
}

export default ArrivalDeparture;
