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

  if (loading) return <div>Camp Population: ...</div>;
  return (
    <div style={{
      display: "flex", gap: 18, background: "#f1f0f6", borderRadius: 12,
      boxShadow: "0 2px 6px #2b2b2290", padding: "16px 18px", alignItems: "center",
      margin: "16px 0 8px 0", fontSize: 18, fontWeight: 600
    }}>
      <span>
        <span style={{
          background: "#48d165",
          color: "#fff",
          padding: "0.23em 1.05em",
          borderRadius: 14, marginRight: 6
        }}>
          {counts.onsite}
        </span>
        On Site
      </span>
      <span>
        <span style={{
          background: "#fab006",
          color: "#fff",
          padding: "0.23em 1.05em",
          borderRadius: 14, marginRight: 6
        }}>
          {counts.arriving}
        </span>
        En Route
      </span>
      <span>
        <span style={{
          background: "#72604e",
          color: "#fff",
          padding: "0.23em 1.05em",
          borderRadius: 14, marginRight: 6
        }}>
          {counts.departed}
        </span>
        Departed
      </span>
    </div>
  );
}

export default CampPopulationWidget;
