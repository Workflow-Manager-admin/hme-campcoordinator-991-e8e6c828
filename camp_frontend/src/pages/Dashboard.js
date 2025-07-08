import React from "react";
import CampPopulationWidget from "./CampPopulationWidget";

// PUBLIC_INTERFACE
function Dashboard() {
  /** Enhanced Dashboard page with modern layout and image placeholders */
  return (
    <div className="container">
      <div className="section-header-image">
        🏜️ Section Header Image: Desert Camp Overview
      </div>
      
      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title">Camp Dashboard</h1>
            <p className="card-subtitle">Your central hub for all camp activities</p>
          </div>
        </div>
        
        <div className="widget-image-placeholder">
          📊 Dashboard Widget Image: Camp Stats & Quick Actions
        </div>
        
        <CampPopulationWidget />
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 'var(--spacing-lg)',
          marginTop: 'var(--spacing-xl)'
        }}>
          <div className="card">
            <div className="card-image-placeholder">
              🎪 Quick Actions Image
            </div>
            <h3>Quick Actions</h3>
            <p>Jump to the most common camp management tasks</p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              <button className="btn btn-small">Check In</button>
              <button className="btn btn-small btn-accent">Sign Up Job</button>
              <button className="btn btn-small btn-secondary">View Events</button>
            </div>
          </div>
          
          <div className="card">
            <div className="card-image-placeholder">
              📋 Recent Activity Image
            </div>
            <h3>Recent Activity</h3>
            <p>Stay updated with the latest camp happenings</p>
            <div className="status status-success">All systems operational</div>
          </div>
          
          <div className="card">
            <div className="card-image-placeholder">
              🌡️ Camp Status Image
            </div>
            <h3>Camp Status</h3>
            <p>Current conditions and important updates</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <div className="status status-info">Weather: Sunny, 85°F</div>
              <div className="status status-warning">Dust advisory active</div>
            </div>
          </div>
        </div>
        
        <div className="alert alert-info" style={{ marginTop: 'var(--spacing-xl)' }}>
          <strong>Welcome to HME Camp!</strong> Use the navigation above to manage arrivals, jobs, meals, and more. 
          All camp members can access most features, while leads and staff have additional management capabilities.
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
