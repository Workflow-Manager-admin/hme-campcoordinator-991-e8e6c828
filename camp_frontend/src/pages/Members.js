import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

/**
 * PUBLIC_INTERFACE
 * CampMemberManagement main page:
 * - Roster list (with role assignments)
 * - Invite new members
 * - Links to member detail/profile view
 */
function Members() {
  const { user, role } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("participant");
  const [inviteStatus, setInviteStatus] = useState("");
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editMember, setEditMember] = useState(null);

  // Fetch roster from Supabase
  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      // NOTE: Assumes members table with columns: id, email, name, role, approved
      let { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) {
        setError("Cannot load members roster");
        setLoading(false);
      } else {
        setMembers(data);
        setLoading(false);
      }
    }
    fetchMembers();
  }, [showEdit]);

  // Logic for inviting new members
  async function handleInvite(e) {
    e.preventDefault();
    setInviteStatus("");
    setError("");
    // Only staff/lead may invite
    if (role !== "staff" && role !== "lead") {
      setError("You don't have permission to invite new members.");
      return;
    }
    // Invite via Supabase Auth (send invitation email flow)
    const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
      inviteEmail,
      { data: { app_role: inviteRole } }
    );
    if (inviteErr) {
      setError(inviteErr.message);
    } else {
      setInviteStatus("Invitation sent to " + inviteEmail);
      setInviteEmail("");
      setInviteRole("participant");
    }
  }

  // Inline profile edit logic
  function openEdit(member) {
    setEditMember(member);
    setShowEdit(true);
  }
  function closeEdit() {
    setShowEdit(false);
    setEditMember(null);
  }

  // Render
  return (
    <section className="container" style={{ maxWidth: 980, margin: "auto", padding: 16 }}>
      <h1>Camp Member Roster</h1>
      <p>
        {members.length === 0 && loading === false ? <em>No members yet.</em> : null}
      </p>
      {error && <div style={{ color: "crimson" }}>{error}</div>}
      {inviteStatus && <div style={{ color: "#185" }}>{inviteStatus}</div>}

      {/* Invite new member form */}
      {(role === "staff" || role === "lead") && (
        <form onSubmit={handleInvite} style={{
          display: "flex",
          gap: 8,
          padding: "10px 0"
        }}>
          <input
            type="email"
            placeholder="Invite by email"
            value={inviteEmail}
            required
            autoFocus
            onChange={e => setInviteEmail(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
            <option value="participant">Participant</option>
            <option value="staff">Staff</option>
            <option value="lead">Lead</option>
          </select>
          <button className="btn" type="submit" style={{ minWidth: 110 }}>
            Invite
          </button>
        </form>
      )}

      {/* Members roster list */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table
          style={{
            width: "100%",
            marginTop: "2rem",
            borderCollapse: "collapse",
            background: "var(--bg-secondary)",
            borderRadius: 10,
            overflow: "hidden"
          }}
        >
          <thead style={{ background: "var(--bg-secondary)" }}>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Profile</th>
              {(role === "lead" || role === "staff") && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.name || <span style={{ color: "#aaa" }}>-</span>}</td>
                <td>{member.email}</td>
                <td>
                  {role === "lead" ? (
                    <RoleSelector member={member} />
                  ) : (
                    member.role
                  )}
                </td>
                <td>
                  {member.approved
                    ? <span style={{ color: "#28b26d" }}>Active</span>
                    : <span style={{ color: "#af8800" }}>Pending</span>
                  }
                </td>
                <td>
                  <button className="btn" onClick={() => openEdit(member)}>Edit</button>
                </td>
                {(role === "lead" || role === "staff") && (
                  <td>
                    {/* Approval toggle */}
                    {!member.approved && (
                      <ApproveButton member={member} />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit profile modal/drawer */}
      {showEdit && (
        <MemberProfileEditor member={editMember} onClose={closeEdit} onSaved={closeEdit} />
      )}
    </section>
  );
}

// PUBLIC_INTERFACE
/**
 * Inline role selector for leads to assign roles.
 */
function RoleSelector({ member }) {
  const { role } = useAuth();
  const [curRole, setCurRole] = useState(member.role);
  const [saving, setSaving] = useState(false);

  async function changeRole(e) {
    setSaving(true);
    const newRole = e.target.value;
    // Only lead can change role
    if (role !== "lead") return;
    // Update in Supabase
    await supabase
      .from("members")
      .update({ role: newRole })
      .eq("id", member.id);
    setCurRole(newRole);
    setSaving(false);
  }
  return (
    <select value={curRole} onChange={changeRole} disabled={saving || role !== "lead"}>
      <option value="participant">Participant</option>
      <option value="staff">Staff</option>
      <option value="lead">Lead</option>
    </select>
  );
}

// PUBLIC_INTERFACE
/**
 * Button to approve pending member (staff/lead only).
 */
function ApproveButton({ member }) {
  const { role } = useAuth();
  const [saving, setSaving] = useState(false);

  const approve = async () => {
    setSaving(true);
    await supabase
      .from("members")
      .update({ approved: true })
      .eq("id", member.id);
    setSaving(false);
    // Reload by dispatching artificial event, or use a refetch trigger in production.
    window.location.reload(); // quick for this demo purpose
  };
  if (role !== "staff" && role !== "lead") return null;
  return (
    <button className="btn" onClick={approve} disabled={saving}>
      {saving ? "Approving..." : "Approve"}
    </button>
  );
}

// PUBLIC_INTERFACE
/**
 * Modal/profile editor for camp member
 * Allows self-edit for current user, or staff/lead to edit any.
 */
function MemberProfileEditor({ member, onClose, onSaved }) {
  const { user, role } = useAuth();
  const isOwn = user && member.email === user.email;
  const [name, setName] = useState(member.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    // Only allow changing fields if is own profile, or staff/lead
    if (!(isOwn || role === "staff" || role === "lead")) {
      setError("You do not have edit permissions.");
      setSaving(false);
      return;
    }
    // Update Supabase
    const { error } = await supabase
      .from("members")
      .update({ name })
      .eq("id", member.id);

    if (error) setError(error.message);
    setSaving(false);
    if (!error) onSaved && onSaved();
  }
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,.32)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
      }}
    >
      <form
        onSubmit={handleSave}
        style={{
          background: "#fff", color: "#222", borderRadius: 16,
          padding: 32, minWidth: 320, maxWidth: 400, boxShadow: "0 4px 32px #2b2b2252"
        }}
      >
        <h2>Edit Profile</h2>
        <label>
          Name &nbsp;
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <br /><br />
        {error && <div style={{ color: "#b00" }}>{error}</div>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          className="btn"
          type="button"
          onClick={onClose}
          disabled={saving}
          style={{ marginLeft: 16, background: "#aaa" }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default Members;
