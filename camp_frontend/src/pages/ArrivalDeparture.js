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
    <div className="container">
      <div className="section-header-image">
        🚐 Section Header Image: Arrivals & Camp Setup
      </div>
      
      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title">Arrivals & Departures</h1>
            <p className="card-subtitle">Log your arrival/departure dates and see current camp attendance</p>
          </div>
        </div>
        
        {!isAuthenticated ? (
          <div className="alert alert-warning">
            Please login to submit your arrival/departure data.
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3>Your Arrival & Departure</h3>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <div className="form-group">
                  <label className="form-label">
                    Arrival Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    required
                    value={myArr}
                    onChange={e => setMyArr(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Departure Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={myDep}
                    onChange={e => setMyDep(e.target.value)}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {saveStatus && <div className="alert alert-success" style={{ margin: 0, padding: 'var(--spacing-xs) var(--spacing-sm)' }}>{saveStatus}</div>}
                {error && <div className="alert alert-error" style={{ margin: 0, padding: 'var(--spacing-xs) var(--spacing-sm)' }}>{error}</div>}
              </div>
            </form>
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <div className="status-card" style={{
            textAlign: 'center',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius-lg)',
            background: 'rgba(72, 209, 101, 0.1)',
            border: '2px solid #48d165'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#48d165',
              marginBottom: 'var(--spacing-xs)'
            }}>
              {onsite}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              On Site
            </div>
          </div>
          
          <div className="status-card" style={{
            textAlign: 'center',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius-lg)',
            background: 'rgba(250, 176, 6, 0.1)',
            border: '2px solid #fab006'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#fab006',
              marginBottom: 'var(--spacing-xs)'
            }}>
              {arriving}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              En Route
            </div>
          </div>
          
          <div className="status-card" style={{
            textAlign: 'center',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius-lg)',
            background: 'rgba(114, 96, 78, 0.1)',
            border: '2px solid #72604e'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#72604e',
              marginBottom: 'var(--spacing-xs)'
            }}>
              {departed}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Departed
            </div>
          </div>
        </div>
        
        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-muted)', textAlign: 'center' }}>
          Live camp population based on crew data
        </p>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            Loading arrivals data...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
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
                  return (
                    <tr key={s.user_id}>
                      <td>{memb.name || <span style={{ color: "var(--text-muted)" }}>?</span>}</td>
                      <td style={{ fontSize: '0.9rem' }}>{memb.email}</td>
                      <td style={{ fontSize: '0.9rem' }}>{s.arrival ? (new Date(s.arrival)).toLocaleString() : "-"}</td>
                      <td style={{ fontSize: '0.9rem' }}>{s.departure ? (new Date(s.departure)).toLocaleString() : "-"}</td>
                      <td>
                        <span className={`status ${
                          st.label === 'On Site' ? 'status-success' :
                          st.label === 'Pending' ? 'status-warning' :
                          st.label === 'Departed' ? 'status-info' : 'status-error'
                        }`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {sessions.length === 0 && !loading && (
          <div className="widget-image-placeholder">
            📅 No arrival data yet - be the first to log your arrival!
          </div>
        )}
        
        <div className="alert alert-info" style={{ marginTop: 'var(--spacing-lg)' }}>
          <strong>Note:</strong> Crew status auto-updates based on real-time dates. Update yours anytime!
        </div>
      </div>
    </div>
  );
}

export default ArrivalDeparture;
