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
    <div className="container">
      <div className="section-header-image">
        👥 Section Header Image: Camp Members & Community
      </div>
      
      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title">Camp Member Roster</h1>
            <p className="card-subtitle">
              {members.length > 0 ? `${members.length} camp members` : 'No members yet'}
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {inviteStatus && <div className="alert alert-success">{inviteStatus}</div>}

        {/* Invite new member form */}
        {(role === "staff" || role === "lead") && (
          <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3>Invite New Member</h3>
            <form onSubmit={handleInvite} style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 'var(--spacing-sm)',
              alignItems: "end"
            }}>
              <div className="form-group" style={{ minWidth: '200px', marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="member@email.com"
                  value={inviteEmail}
                  required
                  onChange={e => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ minWidth: '120px', marginBottom: 0 }}>
                <label className="form-label">Role</label>
                <select className="form-select" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="participant">Participant</option>
                  <option value="staff">Staff</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              <button className="btn" type="submit">
                Send Invite
              </button>
            </form>
          </div>
        )}

        {/* Members roster list */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            Loading members...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                  {(role === "lead" || role === "staff") && <th>Admin</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name || <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                    <td style={{ fontSize: '0.9rem' }}>{member.email}</td>
                    <td>
                      {role === "lead" ? (
                        <RoleSelector member={member} />
                      ) : (
                        <span className="status status-info">{member.role}</span>
                      )}
                    </td>
                    <td>
                      {member.approved
                        ? <span className="status status-success">Active</span>
                        : <span className="status status-warning">Pending</span>
                      }
                    </td>
                    <td>
                      <button className="btn btn-small" onClick={() => openEdit(member)}>
                        Edit
                      </button>
                    </td>
                    {(role === "lead" || role === "staff") && (
                      <td>
                        {!member.approved && (
                          <ApproveButton member={member} />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {members.length === 0 && !loading && (
          <div className="widget-image-placeholder">
            👥 No members yet - invite your first camp member!
          </div>
        )}
      </div>

      {/* Edit profile modal/drawer */}
      {showEdit && (
        <MemberProfileEditor member={editMember} onClose={closeEdit} onSaved={closeEdit} />
      )}
    </div>
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
    <select 
      className="form-select"
      value={curRole} 
      onChange={changeRole} 
      disabled={saving || role !== "lead"}
      style={{ minWidth: '120px' }}
    >
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
    <button className="btn btn-success btn-small" onClick={approve} disabled={saving}>
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
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 'var(--spacing-md)'
      }}
    >
      <form
        onSubmit={handleSave}
        className="card"
        style={{
          background: "var(--bg-card)", 
          color: "var(--text-primary)", 
          borderRadius: 'var(--border-radius-xl)',
          padding: 'var(--spacing-xl)', 
          minWidth: 320, 
          maxWidth: 400, 
          boxShadow: 'var(--shadow-heavy)',
          margin: 0
        }}
      >
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Edit Profile</h2>
        
        <div className="form-group">
          <label className="form-label">
            Full Name
          </label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default Members;
