import React, { useState } from "react";
import { useAuth } from "../AuthContext";

// PUBLIC_INTERFACE
/**
 * AuthForm renders either a Login or Signup form and handles the submission logic.
 * If `inviteOnly` is true, form asks for an invite code/logic as applicable.
 */
function AuthForm({ mode = "login", onAuth, inviteOnly = false }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Example logic for invite code requirement
  const requireInvite = inviteOnly || mode === "signup"; // Adjust as needed

  // PUBLIC_INTERFACE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        onAuth && onAuth();
      } else {
        // For invitation/self-signup, put your logic here to check or store invite codes
        if (requireInvite && !inviteCode) {
          setError("Invite code required for signup.");
          setLoading(false);
          return;
        }
        // Dummy invite validation (replace with actual invite code check if needed)
        if (requireInvite && inviteCode.length < 5) {
          setError("Invalid invite code.");
          setLoading(false);
          return;
        }
        await signUp(email, password, { invite_code: inviteCode });
        onAuth && onAuth();
      }
    } catch (e) {
      setError(e.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 370, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 10, background: "#fafafd" }}>
      <h2>{mode === "login" ? "Camp Login" : "Camp Signup"}</h2>
      <div style={{ margin: "12px 0" }}>
        <label>
          Email
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
      </div>
      <div style={{ margin: "12px 0" }}>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
      </div>
      {requireInvite && (
        <div style={{ margin: "12px 0" }}>
          <label>
            Invitation Code
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              placeholder="Use provided invite"
            />
          </label>
        </div>
      )}
      {error && <div style={{ color: "#c00", margin: "8px 0" }}>{error}</div>}
      <button type="submit" className="btn" style={{ marginTop: 8 }} disabled={loading}>
        {loading ? "Processing..." : mode === "login" ? "Log In" : "Sign Up"}
      </button>
    </form>
  );
}

export default AuthForm;
