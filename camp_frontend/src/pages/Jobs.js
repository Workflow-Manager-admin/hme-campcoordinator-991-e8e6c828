import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

/**
 * PUBLIC_INTERFACE
 * Camp Jobs Board & Messaging Page
 * - View all available jobs/shifts for the week (with categories)
 * - Members can sign up for open jobs/shifts
 * - Staff/leads may assign users or remove volunteers
 * - Built-in messaging for assignments & reminders
 * - Supabase integration for job storage, signups, assignments, and messages
 */
function Jobs() {
  const { user, role, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [signups, setSignups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [msgJob, setMsgJob] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showNewJob, setShowNewJob] = useState(false);
  const [editJob, setEditJob] = useState(null);

  // Basic job roles for dropdowns/category
  const jobCategories = [
    "Kitchen", "Setup", "Teardown", "Ice Run", "Moop", "Bar Shift", "Strike", "Random"
  ];

  // Fetch jobs, signups, members, and messages from Supabase
  useEffect(() => {
    let active = true;
    async function fetchAll() {
      setLoading(true);
      setError("");
      // Jobs table
      let { data: jobsData, error: jobsErr } = await supabase
        .from("jobs")
        .select("*")
        .order("job_time", { ascending: true });
      // Signups table
      let { data: signupData, error: signupErr } = await supabase
        .from("job_signups")
        .select("*");
      // Members table (who can sign up)
      let { data: memberData, error: memErr } = await supabase
        .from("members")
        .select("id, name, email, role");
      // Messages table
      let { data: msgData, error: msgErr } = await supabase
        .from("job_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (!active) return;
      if (jobsErr || signupErr || memErr || msgErr) {
        setError("Failed to load jobs/signups/members/messages from Supabase.");
      } else {
        setJobs(jobsData || []);
        setSignups(signupData || []);
        setMembers(memberData || []);
        setMessages(msgData || []);
      }
      setLoading(false);
    }
    fetchAll();
    // No websocket subscription yet; could refresh on action for now
    // Optionally, add as dependency: showNewJob, saveMsg, showMsg
    // - but that can lead to excess reloads
  }, [showNewJob, showMsg, saveMsg, showNewJob]);

  // Helpers
  // Who has signed up for a shift
  function getJobSignups(job_id) {
    return signups.filter(s => s.job_id === job_id);
  }
  // Who is a member (for assignment)
  function memberName(user_id) {
    const m = members.find(x => x.id === user_id);
    if (m) return m.name || m.email;
    return user_id ? "(unknown)" : "-";
  }
  // Current user already signed up?
  function userSignedUp(job_id) {
    return signups.some(s => s.job_id === job_id && s.user_id === user?.id);
  }
  // Messaging for a job
  function jobMessages(job_id) {
    return messages.filter(m => m.job_id === job_id);
  }

  // Sign up for a shift
  async function handleSignup(job) {
    setSaveMsg(""); setError("");
    if (!isAuthenticated) {
      setError("Please login to volunteer for a shift.");
      return;
    }
    // Check already signed up
    if (userSignedUp(job.id)) {
      setError("You already signed up for this shift.");
      return;
    }
    // Post to Supabase
    const { error } = await supabase
      .from("job_signups")
      .insert([{ job_id: job.id, user_id: user.id }]);
    if (error) setError(error.message);
    else setSaveMsg("Signed up for shift: " + job.title);
  }

  // Withdraw from shift
  async function handleWithdraw(job) {
    setSaveMsg(""); setError("");
    const { error } = await supabase
      .from("job_signups")
      .delete()
      .eq("job_id", job.id).eq("user_id", user.id);
    if (error) setError(error.message);
    else setSaveMsg("Withdrawn from shift: " + job.title);
  }

  // Lead/staff: assign someone to a shift
  async function assignToJob(job, user_id) {
    setSaveMsg(""); setError("");
    // Only allow staff/lead
    if (role !== "lead" && role !== "staff") {
      setError("Permission denied");
      return;
    }
    // Already assigned?
    if (signups.some(s => s.job_id === job.id && s.user_id === user_id)) {
      setError("Already assigned");
      return;
    }
    const { error } = await supabase
      .from("job_signups")
      .insert([{ job_id: job.id, user_id }]);
    if (error) setError(error.message);
    else setSaveMsg(`Assigned member to shift: ${memberName(user_id)}`);
  }

  // Send a reminder or message for a shift
  async function sendMessage(jobId) {
    setSaveMsg(""); setError("");
    if (!message.trim()) {
      setError("Message cannot be empty.");
      return;
    }
    const { error } = await supabase
      .from("job_messages")
      .insert([{
        job_id: jobId,
        author_id: user?.id,
        text: message,
        created_at: new Date().toISOString()
      }]);
    if (error) setError(error.message);
    else {
      setSaveMsg("Message sent.");
      setShowMsg(false);
      setMessage("");
    }
  }

  // Add/Edit job shift (staff/lead)
  async function saveJob(form) {
    setSaveMsg(""); setError("");
    const { id, ...payload } = form;
    if (!payload.title || !payload.category) {
      setError("Title and category required.");
      return false;
    }
    if (editJob) {
      // Update
      const { error } = await supabase.from("jobs").update(payload).eq("id", id);
      if (error) { setError(error.message); return false; }
      setSaveMsg("Updated job!");
      setShowNewJob(false); setEditJob(null);
    } else {
      // Create
      const { error } = await supabase.from("jobs").insert([payload]);
      if (error) { setError(error.message); return false; }
      setSaveMsg("Created new job!");
      setShowNewJob(false);
    }
    return true;
  }

  // Delete a job shift
  async function deleteJob(job) {
    if (!window.confirm("Delete this job posting?")) return;
    setError(""); setSaveMsg("");
    // Remove signups first (to clean up, optional)
    await supabase.from("job_signups").delete().eq("job_id", job.id);
    await supabase.from("job_messages").delete().eq("job_id", job.id);
    const { error } = await supabase.from("jobs").delete().eq("id", job.id);
    if (error) setError(error.message);
    else setSaveMsg("Deleted job!");
  }

  // ---- Rendering ----
  function JobsTable() {
    if (loading) return <div>Loading...</div>;
    if (jobs.length === 0)
      return <div style={{ color: "#888", margin: 18 }}>No camp shifts/jobs are scheduled yet.</div>;
    return (
      <table style={{
        width: "100%",
        marginTop: 16,
        borderCollapse: "collapse",
        borderRadius: 10,
        overflow: "hidden",
        background: "#fafafd",
        fontSize: 16
      }}>
        <thead>
          <tr style={{ background: "#f1f4f9" }}>
            <th>Title</th>
            <th>Category</th>
            <th>Time</th>
            <th>Open Slots</th>
            <th>Volunteers</th>
            {(role === "lead" || role === "staff") && <th>Admin</th>}
            <th>Messaging</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => {
            const jobSignups = getJobSignups(job.id);
            const slotLeft = Math.max(0, (job.slots_required || 1) - jobSignups.length);
            return (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.category}</td>
                <td>{job.job_time ? new Date(job.job_time).toLocaleString() : "-"}</td>
                <td>{slotLeft} / {job.slots_required || 1}</td>
                <td>
                  {jobSignups.length === 0 && <span style={{ color: "#bbb" }}>None</span>}
                  {jobSignups.map(s => (
                    <span key={s.user_id} style={{
                      display: "inline-block",
                      margin: "2px 7px 2px 0",
                      padding: "2px 7px",
                      borderRadius: 8,
                      background: "#CFD8DC",
                      color: "#333",
                    }}>
                      {memberName(s.user_id)}{s.user_id === user?.id && <span style={{ marginLeft: 3 }}>🌟</span>}
                    </span>
                  ))}
                  {/* Withdraw button */}
                  {userSignedUp(job.id) && (
                    <button
                      className="btn"
                      style={{ marginLeft: 10, background: "#ff7043", color: "#fff" }}
                      onClick={() => handleWithdraw(job)}
                    >
                      Withdraw
                    </button>
                  )}
                </td>
                {(role === "lead" || role === "staff") &&
                  <td style={{ minWidth: 140 }}>
                    <button className="btn" onClick={() => { setEditJob(job); setShowNewJob(true); }}>
                      Edit
                    </button>
                    <button className="btn" style={{ marginLeft: 9, background: "#aa243c", color: "white" }}
                      onClick={() => deleteJob(job)}>Delete</button>
                    <br />
                    <span style={{ fontSize: 13 }}>Assign:&nbsp;</span>
                    <select
                      onChange={e => assignToJob(job, e.target.value)}
                      defaultValue=""
                      style={{ fontSize: 14 }}>
                      <option value="" disabled>Choose member</option>
                      {members.map(m => (
                        <option value={m.id} key={m.id}>{m.name || m.email}</option>
                      ))}
                    </select>
                  </td>}
                <td>
                  <button className="btn" style={{ fontSize: 12, padding: "4px 7px" }}
                    onClick={() => { setMsgJob(job); setShowMsg(true); }}>
                    Message
                  </button>
                  <span style={{ marginLeft: 4, color: "#888", fontSize: 13 }}>
                    ({jobMessages(job.id).length})
                  </span>
                </td>
                {/* Sign up button */}
                {!userSignedUp(job.id) && slotLeft > 0 &&
                  <td>
                    <button className="btn" onClick={() => handleSignup(job)}>Sign Up</button>
                  </td>
                }
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 1100, margin: "auto", padding: 20 }}>
      <h1>Camp Jobs Board</h1>
      <p>
        Sign up for essential camp shifts below. Leads/staff can assign, message, and manage all shifts.
      </p>

      {(role === "lead" || role === "staff") && (
        <div style={{ margin: "12px 0" }}>
          <button className="btn" onClick={() => { setShowNewJob(true); setEditJob(null); }}>
            Add New Job/Shift
          </button>
        </div>
      )}

      {error && <div style={{ color: "crimson", margin: 10 }}>{error}</div>}
      {saveMsg && <div style={{ color: "#185", margin: 10 }}>{saveMsg}</div>}

      <JobsTable />

      {showNewJob && (
        <JobEditor
          job={editJob}
          onClose={() => { setShowNewJob(false); setEditJob(null); }}
          onSave={saveJob}
          categories={jobCategories}
        />
      )}

      {/* Messaging dialog */}
      {showMsg && msgJob && (
        <MessageDialog
          job={msgJob}
          onClose={() => { setShowMsg(false); setMsgJob(null); }}
          messages={jobMessages(msgJob.id)}
          members={members}
          user={user}
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
      )}
    </section>
  );
}

// PUBLIC_INTERFACE
/**
 * Modal/form for adding or editing a Job shift (staff/lead only)
 */
function JobEditor({ job, onClose, onSave, categories }) {
  const editing = !!job;
  const [title, setTitle] = useState(job?.title || "");
  const [category, setCategory] = useState(job?.category || (categories[0] || ""));
  const [jobTime, setJobTime] = useState(job?.job_time ? job.job_time.slice(0, 16) : "");
  const [slotsRequired, setSlotsRequired] = useState(job?.slots_required || 1);
  const [desc, setDesc] = useState(job?.description || "");
  const [saving, setSaving] = useState(false);
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave({
      id: job?.id,
      title,
      category,
      job_time: jobTime,
      slots_required: parseInt(slotsRequired),
      description: desc
    });
    setSaving(false);
    if (ok) onClose();
  };
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.29)", zIndex: 20,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <form onSubmit={handleSave} style={{
        background: "#fff", color: "#222", borderRadius: 14,
        padding: 30, minWidth: 320, maxWidth: 430, boxShadow: "0 8px 32px #2b2b2252"
      }}>
        <h2>{editing ? "Edit Shift" : "Add New Job/Shift"}</h2>
        <div style={{ margin: "9px 0" }}>
          <label>
            Title<br />
            <input
              type="text"
              value={title}
              required
              onChange={e => setTitle(e.target.value)}
              style={{ width: "100%", padding: 7 }}
            />
          </label>
        </div>
        <div style={{ margin: "9px 0" }}>
          <label>
            Category<br />
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: 7 }}>
              {categories.map(cat => <option value={cat} key={cat}>{cat}</option>)}
            </select>
          </label>
        </div>
        <div style={{ margin: "9px 0" }}>
          <label>
            Shift Date & Time<br />
            <input
              type="datetime-local"
              value={jobTime}
              onChange={e => setJobTime(e.target.value)}
              style={{ width: "100%", padding: 7 }}
            />
          </label>
        </div>
        <div style={{ margin: "9px 0" }}>
          <label>
            Slots Required<br />
            <input
              type="number"
              min={1}
              value={slotsRequired}
              onChange={e => setSlotsRequired(e.target.value)}
              style={{ width: "100%", padding: 7 }}
            />
          </label>
        </div>
        <div style={{ margin: "9px 0" }}>
          <label>
            Description<br />
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              style={{ width: "100%", padding: 7, minHeight: 60 }}
            />
          </label>
        </div>
        <button className="btn" type="submit" disabled={saving} style={{ minWidth: 120 }}>
          {saving ? "Saving..." : (editing ? "Save Changes" : "Add Shift")}
        </button>
        <button className="btn" type="button" style={{ marginLeft: 14, background: "#aaa", color: "white" }}
          onClick={onClose} disabled={saving}>Cancel</button>
      </form>
    </div>
  );
}

// PUBLIC_INTERFACE
/**
 * Messaging dialog for a specific job/shift (for assignment/reminder comms)
 */
function MessageDialog({ job, onClose, messages, members, user, message, setMessage, sendMessage }) {
  function msgAuthor(msg) {
    if (!msg.author_id) return "(unknown)";
    const m = members.find(x => x.id === msg.author_id);
    return m ? (m.name || m.email) : "(unknown)";
  }
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.23)", zIndex: 40,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: 24,
        width: 520, maxWidth: "94vw", boxShadow: "0 4px 32px #4b4b2a22", color: "#185"
      }}>
        <h3>Shift Messaging: {job.title}</h3>
        <div style={{
          maxHeight: 290, overflowY: "auto", padding: 7,
          border: "1px solid #eee", borderRadius: 10, marginBottom: 13, background: "#fafbfd"
        }}>
          {messages.length === 0 && <div style={{ color: "#aaa" }}>No messages yet. Send an assignment, note, or reminder to all volunteers!</div>}
          {messages.map(m => (
            <div key={m.id} style={{
              margin: "0 0 10px 0",
              padding: "4px 9px",
              borderLeft: "4px solid #5d5181",
              background: "#f3f5f6",
              borderRadius: 8,
              fontSize: 15
            }}>
              <span style={{ color: "#5d5181", fontWeight: "600" }}>{msgAuthor(m)}</span> <span style={{ color: "#888", fontSize: 13, marginLeft: 2 }}>{(new Date(m.created_at)).toLocaleTimeString()}</span>
              <br />
              {m.text}
            </div>
          ))}
        </div>
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(job.id); }}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            type="text"
            placeholder="Type message/reminder to all"
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ flex: 1, padding: "8px", fontSize: 16 }}
            maxLength={280}
          />
          <button className="btn" disabled={!user} style={{ minWidth: 92 }}>Send</button>
          <button className="btn" type="button" style={{ marginLeft: 10, background: "#aaa", color: "white" }} onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  );
}

export default Jobs;
