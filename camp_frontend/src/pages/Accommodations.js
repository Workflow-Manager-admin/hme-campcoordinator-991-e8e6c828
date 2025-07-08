import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

/**
 * PUBLIC_INTERFACE
 * Accommodations management page
 * Features:
 * - List all accommodations (RV/tent/yurt/trailer etc), size, vehicle, generator, AC.
 * - Add, edit, delete accommodation entries (for authorized/lead users).
 * - Simple camp layout visualization for placement overview.
 * Integration: Persists data with Supabase ("accommodations" table).
 */
function Accommodations() {
  const { user, role } = useAuth();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editObj, setEditObj] = useState(null);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // Fetch all accommodations on mount (and after save)
  useEffect(() => {
    let isActive = true;
    async function fetchAccommodations() {
      setLoading(true);
      setError("");
      let { data, error } = await supabase
        .from("accommodations")
        .select("*")
        .order("created_at", { ascending: true });
      if (isActive) {
        if (error) setError("Failed to load accommodations: " + error.message);
        setAccommodations(data || []);
        setLoading(false);
      }
    }
    fetchAccommodations();
    return () => { isActive = false; };
  }, [showEditor, saveMsg]);

  // Launch editor for add or edit
  function openEditor(acc) {
    setEditObj(acc || null);
    setShowEditor(true);
  }
  function closeEditor() {
    setShowEditor(false);
    setEditObj(null);
    setSaveMsg("");
    setError("");
  }

  // Delete handler (lead/staff only)
  async function handleDelete(id) {
    if (!window.confirm("Delete this accommodation?")) return;
    setError(""); setSaveMsg("");
    const { error } = await supabase.from("accommodations").delete().eq("id", id);
    if (error) setError("Delete failed: " + error.message);
    else setSaveMsg("Deleted!");
  }

  // Render accommodations list as a table
  function AccommodationsTable() {
    if (loading) return (
      <div className="loading">
        <div className="spinner"></div>
        Loading accommodations...
      </div>
    );
    
    if (accommodations.length === 0)
      return (
        <div className="widget-image-placeholder">
          🏕️ No accommodations have been added yet - add your first one!
        </div>
      );
    
    return (
      <div style={{ overflowX: "auto", marginBottom: 'var(--spacing-xl)' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Size (ft)</th>
              <th>Owner/Contact</th>
              <th>Vehicle?</th>
              <th>License Plate</th>
              <th>Generator?</th>
              <th>AC?</th>
              <th>Notes</th>
              {(role === "lead" || role === "staff") && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
          {accommodations.map(acc => (
            <tr key={acc.id}>
              <td>
                <span className="status status-info">{acc.structure_type}</span>
              </td>
              <td>{acc.size ? acc.size : "-"}</td>
              <td>{acc.owner ? acc.owner : "-"}</td>
              <td>
                <span className={`status ${acc.has_vehicle ? 'status-success' : 'status-error'}`}>
                  {acc.has_vehicle ? "Yes" : "No"}
                </span>
              </td>
              <td style={{ fontSize: '0.9rem' }}>{acc.vehicle_plate || "-"}</td>
              <td>
                <span className={`status ${acc.has_generator ? 'status-success' : 'status-error'}`}>
                  {acc.has_generator ? "Yes" : "No"}
                </span>
              </td>
              <td>
                <span className={`status ${acc.has_ac ? 'status-success' : 'status-error'}`}>
                  {acc.has_ac ? "Yes" : "No"}
                </span>
              </td>
              <td style={{ fontSize: '0.9rem' }}>{acc.notes || "-"}</td>
              {(role === "lead" || role === "staff") && (
                <td>
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                    <button className="btn btn-small" onClick={() => openEditor(acc)}>Edit</button>
                    <button className="btn btn-small btn-error" onClick={() => handleDelete(acc.id)}>Delete</button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    );
  }

  // For layout: simple horizontal rectangles by structure
  function CampLayoutMap() {
    const maxWidth = 800;
    // Visual scale based on size; accommodations rendered as rectangles with label
    const scaleFt = 6; // px per ft
    return (
      <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Camp Layout Overview</h3>
        <div className="card-image-placeholder" style={{ height: '200px', marginBottom: 'var(--spacing-md)' }}>
          🗺️ Interactive Camp Layout Map
        </div>
        <div style={{
          position: "relative", 
          minHeight: 160, 
          background: "var(--bg-tertiary)", 
          borderRadius: 'var(--border-radius-lg)',
          border: "2px solid var(--border-color)", 
          overflowX: "auto", 
          overflowY: "hidden",
          padding: 'var(--spacing-md)'
        }}>
          {accommodations.map((acc, i) => {
            // Size: treat as width x depth or default visual size
            let [w, d] = acc.size ? acc.size.toLowerCase().split("x").map(s=>parseInt(s)) : [20, 8];
            if (isNaN(w)) w = 20; if (isNaN(d)) d = 8;
            // Stagger vertically for fun
            let top = 14 + (i % 4) * 34;
            return (
              <div
                key={acc.id}
                style={{
                  position: "absolute",
                  left: 18 + (i*38) % (maxWidth-130) + "px",
                  top,
                  width: Math.max(34, w*scaleFt),
                  height: Math.max(22, d*2),
                  background: acc.has_vehicle ? "var(--accent-color)" : "var(--success-color)",
                  border: "2px solid " + (acc.has_ac ? "var(--primary-color)":"var(--secondary-color)"),
                  color: "white",
                  borderRadius: 'var(--border-radius-md)',
                  display: "flex", 
                  alignItems:"center", 
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  boxShadow: 'var(--shadow-light)',
                  transition: 'transform var(--transition-fast)'
                }}
                title={acc.structure_type + (acc.owner ? " ("+acc.owner+")" : "")}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                {acc.structure_type}
                {acc.has_generator && <span style={{marginLeft: 4, fontSize: 11}}>🔋</span>}
                {acc.has_ac && <span style={{marginLeft: 4, fontSize: 11}}>❄️</span>}
              </div>
            );
          })}
        </div>
        <div style={{color: "var(--text-muted)", fontSize: '0.9rem', marginTop: 'var(--spacing-md)', textAlign: 'center'}}>
          Vehicle = 🟧, Non-vehicle = 🟩, Generator = 🔋, AC = ❄️
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section-header-image">
        🏕️ Section Header Image: Camp Layout & Accommodations
      </div>
      
      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title">Accommodations</h1>
            <p className="card-subtitle">
              Manage camp lodging structures, vehicle parking, and generator/AC info for placement planning
            </p>
          </div>
          {(role === "lead" || role === "staff") && (
            <button className="btn" onClick={() => openEditor(null)}>
              Add Accommodation
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {saveMsg && <div className="alert alert-success">{saveMsg}</div>}

        <AccommodationsTable />
        <CampLayoutMap />

        {showEditor && (
          <AccommodationEditor
            accommodation={editObj}
            onClose={closeEditor}
            setError={setError}
            setSaveMsg={setSaveMsg}
          />
        )}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
/**
 * Modal/editor for add/edit accommodation data (lead/staff only)
 */
function AccommodationEditor({ accommodation, onClose, setError, setSaveMsg }) {
  const editing = !!accommodation;
  const [structureType, setStructureType] = useState(accommodation?.structure_type || "");
  const [size, setSize] = useState(accommodation?.size || "");
  const [owner, setOwner] = useState(accommodation?.owner || "");
  const [hasVehicle, setHasVehicle] = useState(!!accommodation?.has_vehicle);
  const [vehiclePlate, setVehiclePlate] = useState(accommodation?.vehicle_plate || "");
  const [hasGenerator, setHasGenerator] = useState(!!accommodation?.has_generator);
  const [hasAC, setHasAC] = useState(!!accommodation?.has_ac);
  const [notes, setNotes] = useState(accommodation?.notes || "");
  const [saving, setSaving] = useState(false);

  // Save new or edited record to Supabase
  async function handleSave(e) {
    e.preventDefault();
    setError(""); setSaveMsg(""); setSaving(true);
    // Minimal validation
    if (!structureType) { setError("Please select a structure type."); setSaving(false); return; }
    if (!size || !/^(\d{1,3})\s*x\s*\d{1,3}$/i.test(size)) {
      setError("Enter size as WIDTHxDEPTH (ft), e.g. 24x8");
      setSaving(false); return;
    }
    // Build insert/update object
    const payload = {
      structure_type: structureType,
      size,
      owner,
      has_vehicle: hasVehicle,
      vehicle_plate: vehiclePlate,
      has_generator: hasGenerator,
      has_ac: hasAC,
      notes,
    };
    let result;
    if (editing) {
      result = await supabase.from("accommodations")
        .update(payload)
        .eq("id", accommodation.id);
    } else {
      result = await supabase.from("accommodations")
        .insert([payload]);
    }
    setSaving(false);
    if (result.error) setError(result.error.message);
    else {
      setSaveMsg(editing ? "Updated!" : "Created!");
      onClose && onClose();
    }
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.5)", zIndex: 20,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 'var(--spacing-md)'
    }}>
      <form onSubmit={handleSave} className="card" style={{
        background: "var(--bg-card)", 
        color: "var(--text-primary)", 
        borderRadius: 'var(--border-radius-xl)',
        padding: 'var(--spacing-xl)', 
        minWidth: 320, 
        maxWidth: 500, 
        boxShadow: 'var(--shadow-heavy)',
        margin: 0,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>
          {editing ? "Edit Accommodation" : "Add Accommodation"}
        </h2>
        
        <div className="form-group">
          <label className="form-label">Structure Type</label>
          <select 
            className="form-select"
            required 
            value={structureType} 
            onChange={e => setStructureType(e.target.value)}
          >
            <option value="">-- Select --</option>
            <option>RV</option>
            <option>Tent</option>
            <option>Yurt</option>
            <option>Trailer</option>
            <option>Dome</option>
            <option>Box Truck</option>
            <option>Car/Van</option>
            <option>Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Size (ft, e.g. 24x8)
          </label>
          <input
            type="text"
            className="form-input"
            required
            placeholder="24x8"
            pattern="^\d{1,3}\s*x\s*\d{1,3}$"
            value={size}
            onChange={e => setSize(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Owner / Contact
          </label>
          <input
            type="text"
            className="form-input"
            value={owner}
            onChange={e => setOwner(e.target.value)}
            placeholder="Name or email"
          />
        </div>
        
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <input 
              type="checkbox" 
              checked={hasVehicle} 
              onChange={e => setHasVehicle(e.target.checked)} 
            />
            Is this a vehicle?
          </label>
          {hasVehicle && (
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              <label className="form-label">License Plate</label>
              <input
                type="text"
                className="form-input"
                value={vehiclePlate}
                placeholder="ABC123"
                onChange={e => setVehiclePlate(e.target.value)}
              />
            </div>
          )}
        </div>
        
        <div className="form-group">
          <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
              <input 
                type="checkbox" 
                checked={hasGenerator} 
                onChange={e => setHasGenerator(e.target.checked)} 
              />
              Generator
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
              <input 
                type="checkbox" 
                checked={hasAC} 
                onChange={e => setHasAC(e.target.checked)} 
              />
              A/C
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input
            type="text"
            className="form-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Additional notes..."
          />
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : (editing ? "Save Changes" : "Add")}
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

export default Accommodations;
