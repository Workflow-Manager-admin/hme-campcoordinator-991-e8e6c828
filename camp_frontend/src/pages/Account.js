import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import AuthForm from "./AuthForm";

// PUBLIC_INTERFACE
/**
 * Account page for login/logout, signup, and display of current user session.
 * Handles onboarding via invite-based or open signup logic.
 */
function Account() {
  const { user, signOut, isAuthenticated } = useAuth();
  const [mode, setMode] = useState("login"); // login or signup

  if (isAuthenticated) {
    return (
      <div style={{ maxWidth: 450, margin: "2rem auto", textAlign: "center" }}>
        <h2>Welcome!</h2>
        <p>
          <strong>Email:</strong> {user.email}
          <br />
          <strong>User ID:</strong> {user.id}
        </p>
        <button className="btn" onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <AuthForm mode={mode} inviteOnly={true} />
      <div style={{ textAlign: "center", marginTop: 18 }}>
        {mode === "login" ? (
          <>
            New member?{" "}
            <button type="button" className="btn" style={{ fontSize: "1em", margin: "0 2px" }} onClick={() => setMode("signup")}>
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button type="button" className="btn" style={{ fontSize: "1em", margin: "0 2px" }} onClick={() => setMode("login")}>
              Log In
            </button>
          </>
        )}
      </div>
      <p style={{ textAlign: "center", color: "#888", marginTop: 12 }}>
        All camp members require an invitation or code to sign up.<br />
      </p>
    </div>
  );
}

export default Account;
