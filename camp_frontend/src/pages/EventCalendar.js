import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

/**
 * PUBLIC_INTERFACE
 * Shared Camp Event Calendar: View, post, and filter camp events. All members may post; events are stored in Supabase.
 * Supports announcements, filtering by type/category, and a monthly calendar view.
 */
function EventCalendar() {
  const { user, isAuthenticated, role } = useAuth();
  // Events schema: {id, title, description, start, end, category, created_by, created_at, announcement (bool), audience}
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  // For calendar month view
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  });

  // Event categories for filtering/posting
  const EVENT_CATEGORIES = [
    "General", "Meal", "Job", "Workshop", "Art", "Party", "Morning", "Night", "Burn", "External", "Music", "Other"
  ];

  // Fetch all events from Supabase on load or after post
  useEffect(() => {
    let active = true;
    async function loadEvents() {
      setLoading(true);
      let { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start", { ascending: true });
      if (!active) return;
      if (error) setError("Failed to load events: " + error.message);
      setEvents(data || []);
      setLoading(false);
    }
    loadEvents();
    return () => { active = false; };
  }, [showEditor, saveMsg]);

  // Filtering logic
  const visibleEvents = filterCat === "all"
    ? events
    : events.filter(e => e.category === filterCat);

  // Group events by ISO date string for calendar grid
  const eventsByDate = {};
  events.forEach(e => {
    const date = e.start && e.start.split("T")[0];
    if (!date) return;
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push(e);
  });

  // Month selector helpers
  function changeMonth(offset) {
    const [year, month] = calendarMonth.split("-").map(Number);
    let newYear = year, newMonth = month + offset;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setCalendarMonth(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  }

  // Calendar matrix for rendering (generate days for month, Sun-Sat)
  function getMonthMatrix(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const matrix = [];
    let week = [];
    let dayNum = 1 - firstWeekday;
    for (let w = 0; w < 6; w++) {
      week = [];
      for (let d = 0; d < 7; d++) {
        if (dayNum < 1 || dayNum > daysInMonth) week.push(null);
        else week.push(dayNum);
        dayNum++;
      }
      matrix.push(week);
    }
    return matrix;
  }

  // Render event calendar month grid
  function CalendarMonthView() {
    const [y, m] = calendarMonth.split("-").map(Number);
    const todayStr = (new Date()).toISOString().split("T")[0];
    const matrix = getMonthMatrix(y, m);

    // Format YYYY-MM-DD helpers
    const pad = n => String(n).padStart(2, "0");
    function dateStr(day) { return y + "-" + pad(m) + "-" + pad(day); }

    return (
      <div style={{ maxWidth: 780, margin: "0 auto 24px auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button className="btn" onClick={() => changeMonth(-1)}>&lt; Prev</button>
          <span style={{ fontSize: 20, fontWeight: 600 }}>
            {new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button className="btn" onClick={() => changeMonth(1)}>Next &gt;</button>
        </div>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #e9e3f4",
          borderRadius: 12,
          background: "#f8f8ff"
        }}>
          <thead>
            <tr style={{ background: "#e9e3f4" }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day =>
                <th key={day} style={{ padding: 7, fontWeight: 500 }}>{day}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {matrix.map((week, wi) =>
              <tr key={wi}>
                {week.map((d, di) => {
                  const datestr = d && dateStr(d);
                  const evts = eventsByDate[datestr] || [];
                  return (
                    <td key={di} style={{
                      minWidth: 68, minHeight: 70, verticalAlign: "top", padding: 5,
                      background: datestr === todayStr ? "#fafad2" : "#fff",
                      border: "1px solid #f0e5ff",
                      position: "relative"
                    }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, marginBottom: 5,
                        color: d === null ? "#ccc" : "#5d5181",
                        opacity: d === null ? 0 : 1
                      }}>
                        {d || ""}
                      </div>
                      {evts.map(e =>
                        <div key={e.id}
                          style={{
                            margin: "4px 0",
                            padding: "4px 7px",
                            borderRadius: 7,
                            background: e.announcement ? "#dae9ff" : "#f4f0fd",
                            borderLeft: "4px solid " + (catColor(e.category)),
                            fontSize: 13,
                            cursor: "pointer"
                          }}
                          title={e.title + " – " + (e.start ? e.start.slice(11, 16) : "")}
                          onClick={() => setEditEvent(e)}
                        >
                          <strong>{e.title}</strong>
                          <div style={{ fontSize: 11, color: "#665" }}>
                            {e.start ? e.start.slice(11, 16) : ""} {e.category && `[${e.category}]`}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ color: "#888", margin: "8px 0 0 0", fontSize: 13 }}>
          Click on any event to view details.
        </div>
      </div>
    );
  }

  // Filter UI and announcements panel
  function EventFilters() {
    return (
      <div style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        margin: "0 0 12px 0"
      }}>
        <label>
          <b>Filter by type:</b>{" "}
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: 4, minWidth: 110 }}>
            <option value="all">All</option>
            {EVENT_CATEGORIES.map(cat => (
              <option value={cat} key={cat}>{cat}</option>
            ))}
          </select>
        </label>
        <button className="btn" style={{ marginLeft: 10 }} onClick={() => setShowEditor(true)}>
          Post New Event
        </button>
        <span style={{ color: "#ff7043", fontWeight: 500 }}>Announcements shown in blue</span>
      </div>
    );
  }

  // Event detail modal/editor for existing event
  function EventDetail({ event, onClose }) {
    if (!event) return null;
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.18)", zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{
          background: "#fff", borderRadius: 15, minWidth: 310, maxWidth: 450, boxShadow: "0 8px 23px #2223",
          padding: 28
        }}>
          <h2>{event.title}</h2>
          {event.announcement && <div style={{
            color: "#3973ca", background: "#d6e7fd", borderRadius: 7,
            padding: "4px 10px", marginBottom: 9, fontWeight: 600
          }}>Announcement</div>}
          <div style={{ fontSize: 15, color: "#666" }}>
            <span><b>Date:</b> {event.start ? (new Date(event.start)).toLocaleString() : "-"}</span><br />
            {event.end && event.end !== event.start &&
              <span><b>End:</b> {(new Date(event.end)).toLocaleString()}<br /></span>
            }
            <span><b>Category:</b> {event.category || "-"}</span><br />
            <span><b>Audience:</b> {event.audience || "All"}</span><br />
            {event.description && <span><b>Description:</b> {event.description}<br /></span>}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
            Posted by: {event.created_by || "(unknown)"}, at {event.created_at ? (new Date(event.created_at)).toLocaleString() : "-"}
          </div>
          <button className="btn" style={{ marginTop: 12, background: "#777", color: "white" }} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  // Handler for color coding categories.
  function catColor(cat) {
    if (!cat) return "#5d5181";
    const idx = EVENT_CATEGORIES.indexOf(cat);
    // Use color palette by index (primary, secondary, accent, then soft pastels)
    const palette = ["#5d5181", "#CFD8DC", "#FF7043", "#3973ca", "#e5a25d", "#32cd7e", "#ab6f32", "#f3e5f5", "#888", "#f4b12a", "#d3beef", "#dae9ff"];
    return palette[idx % palette.length];
  }

  // Full event list (below calendar): shows all, can filter/announce
  function EventsTable() {
    if (loading) return <div>Loading events...</div>;
    if (!visibleEvents.length)
      return <div style={{ color: "#bbb", margin: 18 }}>No events posted yet for this filter.</div>;
    return (
      <table style={{
        width: "100%", background: "#f8f8ff", borderRadius: 10, fontSize: 15,
        margin: "12px 0", borderCollapse: "collapse"
      }}>
        <thead>
          <tr style={{ background: "#efe4fa" }}>
            <th>Title</th>
            <th>Date/Time</th>
            <th>Category</th>
            <th>Announcement</th>
            <th>By</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {visibleEvents.map(ev =>
            <tr key={ev.id} style={{
              background: ev.announcement ? "#e3edfd" : "",
              cursor: "pointer"
            }}
              onClick={() => setEditEvent(ev)}
            >
              <td>{ev.title}</td>
              <td>{ev.start ? (new Date(ev.start)).toLocaleString() : ""}{ev.end && ev.end !== ev.start && ("–" + (new Date(ev.end)).toLocaleTimeString())}</td>
              <td style={{ color: catColor(ev.category) }}>{ev.category}</td>
              <td>{ev.announcement ? <b>Yes</b> : ""}</td>
              <td>{ev.created_by || "?"}</td>
              <td>{ev.description}</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  // Modal editor for add new event (or edit). Announcement requires special role or "member".
  function EventEditor({ event, onClose, onSaved }) {
    const editing = !!event;
    const [title, setTitle] = useState(event?.title || "");
    const [start, setStart] = useState(event?.start ? event.start.slice(0, 16) : "");
    const [end, setEnd] = useState(event?.end ? event.end.slice(0, 16) : "");
    const [cat, setCat] = useState(event?.category || EVENT_CATEGORIES[0]);
    const [desc, setDesc] = useState(event?.description || "");
    const [announcement, setAnnouncement] = useState(!!event?.announcement);
    const [audience, setAudience] = useState(event?.audience || "All");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    async function handleSave(e) {
      e.preventDefault();
      setSaving(true); setFormError("");
      if (!title || !start) { setFormError("Title and date/time required."); setSaving(false); return; }
      if (announcement && !isAuthenticated) { setFormError("Login required."); setSaving(false); return; }
      const payload = {
        title,
        start: start,
        end: end || start,
        category: cat,
        description: desc,
        created_by: user?.email || "Anon",
        announcement,
        audience,
        created_at: event?.created_at || new Date().toISOString()
      };
      let r;
      if (editing) {
        r = await supabase.from("events").update(payload).eq("id", event.id);
      } else {
        r = await supabase.from("events").insert([payload]);
      }
      setSaving(false);
      if (r.error) setFormError(r.error.message);
      else { onSaved && onSaved(); onClose(); }
    }
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.13)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <form onSubmit={handleSave} style={{
          background: "#fff", borderRadius: 15, padding: 24, minWidth: 300, maxWidth: 440, boxShadow: "0 6px 23px #5d518141"
        }}>
          <h2>{editing ? "Edit Event" : "Post New Event"}</h2>
          <label>
            Title<br />
            <input type="text" value={title} required onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: 7 }} />
          </label>
          <div style={{ margin: "10px 0 3px 0", display: "flex", gap: 8 }}>
            <label>
              Start Date/Time<br />
              <input type="datetime-local" value={start} required onChange={e => setStart(e.target.value)} />
            </label>
            <label>
              End<br />
              <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
            </label>
          </div>
          <div style={{ margin: "7px 0 5px 0" }}>
            <label>
              Category
              <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: "100%", padding: 7 }}>
                {EVENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </label>
          </div>
          <label>
            Description<br />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} style={{ width: "100%" }} />
          </label>
          <div style={{ margin: "11px 0 7px 0" }}>
            <label>
              <input type="checkbox" checked={announcement} onChange={e => setAnnouncement(e.target.checked)} />
              &nbsp; Mark as Announcement <span style={{ color: "#3973ca" }}> [everyone sees!]</span>
            </label>
          </div>
          <div>
            <label>
              Audience <small>(optional)</small><br />
              <input type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="All, leads, kitchen, etc." style={{ width: "100%" }} />
            </label>
          </div>
          {formError && <div style={{ color: "#c00", margin: "6px 0" }}>{formError}</div>}
          <button className="btn" type="submit" style={{ minWidth: 110 }} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save" : "Post"}
          </button>
          <button className="btn" type="button" style={{ marginLeft: 14, background: "#aaa", color: "white" }} onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 1050, margin: "auto", padding: 20 }}>
      <h1>Camp Shared Event Calendar</h1>
      <p>
        <strong>View and post upcoming events, activities, and announcements for the whole camp.</strong><br />
        Any member may post or propose an event. Announcements are flagged for all to see.<br />
        Filter the schedule by event category/type below. Click a day or event for more info!
      </p>

      <EventFilters />

      <CalendarMonthView />

      <EventsTable />

      {showEditor && <EventEditor
        onClose={() => setShowEditor(false)}
        onSaved={() => setSaveMsg("Event posted!")}
      />}

      {!!editEvent && <EventDetail event={editEvent} onClose={() => setEditEvent(null)} />}

      {error && <div style={{ color: "#c00", margin: 12 }}>{error}</div>}
      {saveMsg && <div style={{ color: "#185", margin: 12 }}>{saveMsg}</div>}
    </section>
  );
}

export default EventCalendar;
