import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

/**
 * PUBLIC_INTERFACE
 * Dues dashboard: Shows all members, dues owed, payment status, and Venmo integration.
 */
function Dues() {
  const [members, setMembers] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");
  const { user, isAuthenticated, role } = useAuth();
  const VENMO_HANDLE = "HMEdues"; // Replace with actual Venmo handle or business username

  // Dues amount logic (simple: flat dues, can be customized per member/role/future)
  const BASE_DUES = 275; // Default dues in USD

  // Fetch members and dues on load
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      setError("");
      // Get all camp members (id, name, email, role)
      const { data: membs, error: e1 } = await supabase
        .from("members")
        .select("id, name, email, role")
        .order("created_at", { ascending: true });

      // Get all dues records
      const { data: duesRows, error: e2 } = await supabase
        .from("dues")
        .select("id, user_id, amount, paid, paid_at, venmo_txn")
        .order("id", { ascending: true });

      if (!mounted) return;

      if (e1 || e2) setError("Failed to load dues/member roster.");
      else {
        setMembers(membs || []);
        setDues(duesRows || []);
      }
      setLoading(false);
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  // Helper map for quick lookup
  const duesByUser = {};
  for (const d of dues) duesByUser[d.user_id] = d;

  // Handler to confirm self-payment (for member)
  async function confirmSelfPaid() {
    if (!user) return;
    setUpdatingId(user.id);
    setSaveMsg("");
    const dueRow = duesByUser[user.id];
    // Patch as paid, add timestamp (manual confirmation)
    const { error } = await supabase
      .from("dues")
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq("user_id", user.id);
    setUpdatingId(null);
    if (error) setError("Error updating payment: " + error.message);
    else setSaveMsg("Marked as paid (confirmation submitted)!");
  }

  // Admin/staff/manual mark as paid/undo
  async function markPaid(userId, value) {
    setUpdatingId(userId);
    setSaveMsg("");
    const updateObj = value
      ? { paid: true, paid_at: new Date().toISOString() }
      : { paid: false, paid_at: null, venmo_txn: null };
    const { error } = await supabase
      .from("dues")
      .update(updateObj)
      .eq("user_id", userId);
    setUpdatingId(null);
    if (error) setError("Error updating payment: " + error.message);
    else setSaveMsg(value ? "Member marked paid." : "Payment marked unpaid.");
  }

  // Venmo payment link/button (mobile deep link or web-parms)
  function venmoPayLink(member, amount) {
    // web: https://venmo.com/HANDLE?txn=pay&amount=XX&note=Camp%20Dues
    const handle = VENMO_HANDLE;
    const note = encodeURIComponent("HME Camp Dues 2024 - " + (member.name || member.email));
    // Open in new tab: either to app (on mobile) or site (on desktop)
    return `https://venmo.com/${handle}?txn=pay&amount=${encodeURIComponent(amount)}&note=${note}`;
  }

  // Render main table rows for all members
  function TableRow({ member }) {
    const dueRow = duesByUser[member.id];
    const amount = dueRow?.amount || BASE_DUES;
    const isPaid = dueRow?.paid;
    const myRow = user && member.id === user.id;
    // Only staff/lead can update anyone, members can update own
    const canAdmin = (role === "lead" || role === "staff");
    return (
      <tr
        style={{
          background: myRow ? "#f9f7f3" : undefined,
          opacity: isPaid ? 0.72 : 1.0,
        }}
      >
        <td>{member.name || <span style={{ color: "#aaa" }}>-</span>}</td>
        <td>{member.email}</td>
        <td>{amount}</td>
        <td>
          {dueRow && dueRow.paid ? (
            <span style={{ color: "#319176", fontWeight: 600 }}>Paid{dueRow.paid_at && <><br /><span style={{ color: "#444", fontWeight: 400, fontSize: 13 }}>{(new Date(dueRow.paid_at)).toLocaleDateString()}</span></>}</span>
          ) : (
            <span style={{ color: "#c23d36", fontWeight: 600 }}>Unpaid</span>
          )}
        </td>
        <td>
          {/* Payment action - only show for own row and unpaid */}
          {myRow && !isPaid && (
            <a
              href={venmoPayLink(member, amount)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                background: "#FF7043",
                color: "#fff",
                marginBottom: 7,
                display: "block"
              }}
            >
              Pay with Venmo
            </a>
          )}
          {myRow && isAuthenticated && !isPaid && (
            <button
              className="btn"
              style={{ background: "#5d5181", color: "#fff" }}
              disabled={updatingId === user.id}
              onClick={confirmSelfPaid}
            >
              {updatingId === user.id ? "Saving..." : "Mark as Paid"}
            </button>
          )}
          {/* Admin actions */}
          {canAdmin && !myRow && (
            isPaid ? (
              <button
                className="btn"
                style={{ background: "#666", color: "#fff" }}
                onClick={() => markPaid(member.id, false)}
                disabled={updatingId === member.id}
              >
                Mark Unpaid
              </button>
            ) : (
              <button
                className="btn"
                style={{ background: "#2cbe6a", color: "#fff" }}
                onClick={() => markPaid(member.id, true)}
                disabled={updatingId === member.id}
              >
                Mark Paid
              </button>
            )
          )}
        </td>
        <td>
          {/* Venmo TXN (future: could be shown/linked, or input by admin) */}
          {dueRow && dueRow.venmo_txn ? (
            <a href={`https://venmo.com/code?txn=${dueRow.venmo_txn}`} target="_blank" rel="noopener noreferrer">
              View Venmo
            </a>
          ) : (
            "-"
          )}
        </td>
      </tr>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 970, margin: "auto", padding: 18 }}>
      <h1>Dues & Payments</h1>
      <p>
        All camp members must pay dues for participation (default: <strong>${BASE_DUES} per person</strong>).
        Use the Venmo link to pay, or mark as paid once completed.
        {role === "lead" || role === "staff" ? <><br />(Staff/Leads can update anyone's status.)</> : null}
      </p>
      {error && <div style={{ color: "#b00", margin: 10 }}>{error}</div>}
      {saveMsg && <div style={{ color: "#319176", margin: 10 }}>{saveMsg}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            marginTop: "14px",
            borderCollapse: "collapse",
            background: "#f9f9fb",
            borderRadius: 10,
            fontSize: 16
          }}>
            <thead>
              <tr style={{ background: "#f3f1f9" }}>
                <th>Name</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Venmo</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <TableRow member={member} key={member.id} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{
        marginTop: 20,
        fontSize: 14,
        color: "#555",
        background: "#f3e5f5",
        padding: "18px 16px",
        borderRadius: 10,
        maxWidth: 600,
        marginLeft: "auto",
        marginRight: "auto"
      }}>
        <strong>NOTE:</strong> Payments are processed via Venmo.com/web/app. This app does not store payment details; status updates are manual for now.<br />
        After paying with Venmo, click <strong>Mark as Paid</strong> to confirm. Staff will review.
      </div>
    </section>
  );
}

export default Dues;
