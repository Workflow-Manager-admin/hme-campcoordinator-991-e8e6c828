import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

/**
 * CampPopulationWidget shows live in-camp, en route, and departed counts.
 * (Smaller UI card/widget for the Dashboard)
 */
// PUBLIC_INTERFACE
function CampPopulationWidget() {
  const [counts, setCounts] = useState({ onsite: 0, arriving: 0, departed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchCounts() {
      setLoading(true);
      let { data: arrs, error } = await supabase.from("arrivals")
        .select("arrival, departure");
      if (!active) return;
      const now = new Date();
      let onsite = 0, arriving = 0, departed = 0;
      (arrs || []).forEach(row => {
        const arr = row.arrival ? new Date(row.arrival) : null;
        const dep = row.departure ? new Date(row.departure) : null;
        if (!arr) return;
        if (dep && now > dep) departed++;
        else if (arr && now >= arr && (!dep || now < dep)) onsite++;
        else if (arr && now < arr) arriving++;
      });
      setCounts({ onsite, arriving, departed });
      setLoading(false);
    }
    fetchCounts();
    // Could add subscription here for live update
    return () => { active = false; };
  }, []);

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      Loading camp population...
    </div>
  );
  
  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Camp Population Status</h3>
      <div style={{
        display: "flex", 
        gap: 'var(--spacing-md)', 
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        <div className="status-card" style={{
          textAlign: 'center',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--border-radius-lg)',
          background: 'rgba(72, 209, 101, 0.1)',
          border: '2px solid #48d165',
          minWidth: '100px'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#48d165',
            marginBottom: 'var(--spacing-xs)'
          }}>
            {counts.onsite}
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
          border: '2px solid #fab006',
          minWidth: '100px'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#fab006',
            marginBottom: 'var(--spacing-xs)'
          }}>
            {counts.arriving}
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
          border: '2px solid #72604e',
          minWidth: '100px'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#72604e',
            marginBottom: 'var(--spacing-xs)'
          }}>
            {counts.departed}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Departed
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampPopulationWidget;
