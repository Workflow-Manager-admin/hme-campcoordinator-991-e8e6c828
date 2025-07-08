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
    if (loading) return <div>Loading...</div>;
    if (accommodations.length === 0)
      return <div style={{ color: "#888", margin: 18 }}>No accommodations have been added yet.</div>;
    return (
      <table style={{
        width: "100%", marginTop: 20, borderCollapse: "collapse",
        borderRadius: 10, overflow: "hidden", background: "#fafafd"
      }}>
        <thead>
          <tr style={{ background: "#f6effb" }}>
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
            <td>{acc.structure_type}</td>
            <td>{acc.size ? acc.size : "-"}</td>
            <td>{acc.owner ? acc.owner : "-"}</td>
            <td>{acc.has_vehicle ? "Yes" : "No"}</td>
            <td>{acc.vehicle_plate || "-"}</td>
            <td>{acc.has_generator ? "Yes" : "No"}</td>
            <td>{acc.has_ac ? "Yes" : "No"}</td>
            <td>{acc.notes || "-"}</td>
            {(role === "lead" || role === "staff") && (
              <td>
                <button className="btn" onClick={() => openEditor(acc)} style={{marginRight:8}}>Edit</button>
                <button className="btn" onClick={() => handleDelete(acc.id)} style={{background:"#aa243c",color:"white"}}>Delete</button>
              </td>
            )}
          </tr>
        ))}
        </tbody>
      </table>
    );
  }

  // For layout: simple horizontal rectangles by structure
  function CampLayoutMap() {
    const maxWidth = 800;
    // Visual scale based on size; accommodations rendered as rectangles with label
    const scaleFt = 6; // px per ft
    return (
      <div style={{
        width: maxWidth, minHeight: 160, margin: "36px auto 0 auto", background: "#d5d1ea",
        borderRadius: 16, padding: 24, boxShadow: "0 4px 32px #a2adb490"
      }}>
        <h3 style={{color: "#5d5181"}}>Camp Layout Overview</h3>
        <div style={{
          position: "relative", height: 160, background: "#e7f0ee", borderRadius: 12,
          border: "1px solid #b0a8d2", overflowX: "auto", overflowY: "hidden"
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
                  background: acc.has_vehicle ? "#ffb947" : "#9be2bf",
                  border: "2px solid " + (acc.has_ac ? "#ad81e2":"#5d5181"),
                  color: "#212",
                  borderRadius: 7,
                  display: "flex", alignItems:"center", justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "0 2px 10px #bbbcc5a0"
                }}
                title={acc.structure_type + (acc.owner ? " ("+acc.owner+")" : "")}
              >
                {acc.structure_type}
                {acc.has_generator && <span style={{marginLeft: 7, fontSize: 13, color:"#6a3758"}}>🔋</span>}
                {acc.has_ac && <span style={{marginLeft: 7, fontSize: 13, color:"#2171b9"}}>❄️</span>}
              </div>
            );
          })}
        </div>
        <div style={{color: "#636", fontSize:13, marginTop:6}}>Vehicle = 🟧, Non-vehicle = 🟩, Generator = 🔋, AC = ❄️</div>
      </div>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 970, margin: "auto", padding: 20 }}>
      <h1>Accommodations</h1>
      <p>Manage camp lodging structures (RV, tent, yurt, trailer, etc), vehicle parking, and generator/AC info for placement planning.</p>
      {(role === "lead" || role === "staff") && (
        <div style={{ margin: "12px 0" }}>
          <button className="btn" onClick={() => openEditor(null)}>
            Add Accommodation
          </button>
        </div>
      )}

      {error && <div style={{ color: "crimson", margin: 10 }}>{error}</div>}
      {saveMsg && <div style={{ color: "#185", margin: 10 }}>{saveMsg}</div>}

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
    </section>
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
      background: "rgba(0,0,0,0.29)", zIndex: 20,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <form onSubmit={handleSave} style={{
        background: "#fff", color: "#222", borderRadius: 14,
        padding: 30, minWidth: 320, maxWidth: 420, boxShadow: "0 8px 32px #2b2b2252"
      }}>
        <h2>{editing ? "Edit Accommodation" : "Add Accommodation"}</h2>
        <div style={{ margin: "9px 0" }}>
          <label>Structure Type<br/>
            <select required value={structureType} onChange={e => setStructureType(e.target.value)} style={{width:"100%",padding:"7px"}}>
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
          </label>
        </div>
        <div style={{ margin: "9px 0" }}>
          <label>
            Size (ft, e.g. 24x8)<br/>
            <input
              type="text"
              required
              placeholder="24x8"
              pattern="^\\d{1,3}\\s*x\\s*\\d{1,3}$"
              value={size}
              onChange={e => setSize(e.target.value)}
              style={{ width: "100%", padding: 7 }}
            />
          </label>
        </div>
        <div style={{ margin: "9px 0" }}>
          <label>
            Owner / Contact<br/>
            <input
              type="text"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              style={{ width: "100%", padding: 7 }}
              placeholder="Name or email"
            />
          </label>
        </div>
        <div style={{ margin: "9px 0" }}>
          <label>
            <input type="checkbox" checked={hasVehicle} onChange={e => setHasVehicle(e.target.checked)} />
            &nbsp; Is this a vehicle?
          </label>
          &nbsp;&nbsp;
          <label>
            License Plate:&nbsp;
            <input
              type="text"
              value={vehiclePlate}
              disabled={!hasVehicle}
              placeholder="ABC123"
              onChange={e => setVehiclePlate(e.target.value)}
              style={{padding:"3px 7px"}}
            />
          </label>
        </div>
        <div style={{ margin: "9px 0" }}>
          <label>
            <input type="checkbox" checked={hasGenerator} onChange={e => setHasGenerator(e.target.checked)} />
            &nbsp; Generator
          </label>
          &nbsp;&nbsp;
          <label>
            <input type="checkbox" checked={hasAC} onChange={e => setHasAC(e.target.checked)} />
            &nbsp; A/C
          </label>
        </div>
        <div style={{ margin: "9px 0" }}>
          <label>
            Notes<br/>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ width: "100%", padding: 7 }}
            />
          </label>
        </div>
        {setError && <div style={{ color: "#c00", margin: "7px 0" }}></div>}
        <button className="btn" type="submit" style={{minWidth:120}} disabled={saving}>
          {saving ? "Saving..." : (editing ? "Save Changes" : "Add")}
        </button>
        <button className="btn" type="button" style={{marginLeft:14, background:"#aaa",color:"white"}} onClick={onClose} disabled={saving}>Cancel</button>
        {setError && <div style={{ color: "#c00", margin: "7px 0" }}>{setError}</div>}
      </form>
    </div>
  );
}

export default Accommodations;
