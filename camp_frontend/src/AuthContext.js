import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

// PUBLIC_INTERFACE
export const AuthContext = createContext();

/**
 * PUBLIC_INTERFACE
 * AuthProvider wraps the app and provides authentication state and methods.
 * Tracks user session, roles, and exposes sign-in/up/out functions.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // Supabase user object
  const [session, setSession] = useState(null); // Supabase session
  const [loading, setLoading] = useState(true); // Loading indicator for auth

  // Helper to extract app roles (if embedded in user metadata)
  function getUserRole(user) {
    // If you use custom claims/roles, extract it here (default: 'participant')
    // Example: return user?.user_metadata?.role || 'participant';
    return user ? 'participant' : null;
  }

  useEffect(() => {
    // On mount, get current session and listen to changes (login/logout)
    const currentSession = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener?.subscription && listener.subscription.unsubscribe();
    };
  }, []);

  // PUBLIC_INTERFACE
  // Sign in using email/password
  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
    return data?.session;
  }, []);

  // PUBLIC_INTERFACE
  // Sign up using email/password
  const signUp = useCallback(async (email, password, meta={}) => {
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email, password, options: { data: meta }
    });
    setLoading(false);
    if (error) throw error;
    return data?.session;
  }, []);

  // PUBLIC_INTERFACE
  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) throw error;
    setSession(null);
    setUser(null);
  }, []);

  const value = {
    user,
    session,
    loading,
    role: getUserRole(user),
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// PUBLIC_INTERFACE
// Hook to use AuthContext
export function useAuth() {
  return useContext(AuthContext);
}
