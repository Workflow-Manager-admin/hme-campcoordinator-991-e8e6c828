import React from "react";
import CampPopulationWidget from "./CampPopulationWidget";

// PUBLIC_INTERFACE
function Dashboard() {
  /** Dashboard page, now with camp population widget */
  return (
    <section className="container" style={{ maxWidth: 900, margin: "auto" }}>
      <h1>Dashboard</h1>
      <CampPopulationWidget />
      <p style={{ marginTop: 22 }}>Welcome to the HME Camp Dashboard!</p>
      <div style={{ marginTop: 30, color: "#888" }}>
        Use the navigation to manage arrivals, jobs, meals, and more.
      </div>
    </section>
  );
}

export default Dashboard;
