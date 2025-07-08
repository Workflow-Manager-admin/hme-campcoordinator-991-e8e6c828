import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

/**
 * PUBLIC_INTERFACE
 * Meals Planning Module for HME Burning Man Camp App.
 * Features:
 * - Collaborative camp meal calendar/schedule (plan meals by day)
 * - Members sign up for meal cooking, cleaning, participation, or special tasks per meal
 * - Shared shopping list/supplies with task/self-assignment
 * - Dietary restrictions/preferences input form (saved per user)
 * - Supabase integration for all data tables: meals, meal_participants, shopping_list, dietary_info
 * - Modern, collaborative UI per PRD and Burning_Man_Camp_App_Architecture.md
 */
function Meals() {
  const { user, isAuthenticated } = useAuth();

  // "Meals" = {id, date, type, title, description, cook_ids, created_by, updated_at}
  const [meals, setMeals] = useState([]);
  // "Meal Participants" = {id, meal_id, user_id, role (cook/eater/cleanup), comment, created_at}
  const [participants, setParticipants] = useState([]);
  // "Shopping List" = {id, item, needed_for (meal_id/null), assigned_to, obtained (bool), notes, created_by}
  const [shoppingList, setShoppingList] = useState([]);
  // "Dietary Info" = {id, user_id, restrictions, allergies, notes, created_at}
  const [myDiet, setMyDiet] = useState(null);

  // UI editing states/modal controls
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [editMeal, setEditMeal] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showDietForm, setShowDietForm] = useState(false);
  const [addShopItem, setAddShopItem] = useState(false);

  // Load all relevant data on mount/refresh
  useEffect(() => {
    let active = true;
    async function fetchData() {
      // Meals
      let { data: mealsData } = await supabase
        .from("meals")
        .select("*")
        .order("date", { ascending: true });
      // Participants
      let { data: partData } = await supabase
        .from("meal_participants")
        .select("*");
      // Shopping List
      let { data: shopData } = await supabase
        .from("shopping_list")
        .select("*")
        .order("obtained", { ascending: true });
      // Dietary Info (current user)
      let dietRow = null;
      if (user) {
        let { data: diet } = await supabase
          .from("dietary_info")
          .select("*")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        dietRow = diet || null;
      }
      if (active) {
        setMeals(mealsData || []);
        setParticipants(partData || []);
        setShoppingList(shopData || []);
        setMyDiet(dietRow);
      }
    }
    fetchData();
    return () => { active = false; }
    // eslint-disable-next-line
  }, [addMealOpen, editMeal, addShopItem, showDietForm, user]); // reload after changes

  // ---- UI Components ----

  // Meals Calendar Table
  function MealsScheduleTable() {
    if (!meals.length) return (
      <div style={{ color: "#bbb", margin: 14 }}>No meals scheduled yet.</div>
    );
    // group by day & type for display; breakfast/lunch/dinner/other
    return (
      <table style={{
        width: "100%", marginTop: 16, borderCollapse: "collapse",
        background: "#fafafd", borderRadius: 9, fontSize: 16
      }}>
        <thead>
          <tr style={{ background: "#f5f1fc" }}>
            <th>Date</th>
            <th>Meal</th>
            <th>Description</th>
            <th>Cooks</th>
            <th>Participants</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {meals.map(meal => {
            const cooks = participants.filter(p => p.meal_id === meal.id && p.role === "cook");
            const eaters = participants.filter(p => p.meal_id === meal.id && p.role === "eater");
            return (
              <tr key={meal.id}>
                <td>{meal.date ? (new Date(meal.date)).toLocaleDateString() : "-"}</td>
                <td>{meal.type}</td>
                <td>{meal.title || meal.description || "-"}</td>
                <td>
                  {cooks.length === 0 && <span style={{ color: "#999" }}>None</span>}
                  {cooks.map(c => (
                    <span key={c.user_id} style={{ marginRight: 7 }}>👩‍🍳</span>
                  ))}
                </td>
                <td>
                  {eaters.length === 0 && <span style={{ color: "#aaa" }}>None</span>}
                  {eaters.map(e => (
                    <span key={e.user_id} style={{ marginRight: 7 }}>🍽️</span>
                  ))}
                </td>
                <td>
                  <button
                    className="btn"
                    style={{ fontSize: 13, marginRight: 7, padding: "4px 10px" }}
                    onClick={() => setSelectedMeal(meal)}
                  >View</button>
                  {/* Only allow editing for creator */}
                  {user && meal.created_by === user.id &&
                    <button
                      className="btn"
                      style={{ background: "#8e6ec0", color: "white", fontSize: 13, padding: "4px 10px" }}
                      onClick={() => { setEditMeal(meal); setAddMealOpen(true); }}
                    >Edit</button>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  // Add/Edit Meal Modal/Dialog
  function MealEditor({ meal, onClose }) {
    const editing = !!meal;
    const [type, setType] = useState(meal?.type || "Dinner");
    const [date, setDate] = useState(meal?.date ? meal.date.slice(0, 10) : "");
    const [time, setTime] = useState(meal?.date ? meal.date.slice(11, 16) : "19:00");
    const [title, setTitle] = useState(meal?.title || "");
    const [desc, setDesc] = useState(meal?.description || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSave(e) {
      e.preventDefault();
      setSaving(true);
      setError("");
      if (!date) { setError("Date required."); setSaving(false); return; }
      const dtISO = (date && time ? date + "T" + time : date);
      const payload = {
        type, date: dtISO, title, description: desc,
        updated_at: new Date().toISOString(), created_by: user.id
      };
      let resp;
      if (editing) {
        resp = await supabase.from("meals").update(payload).eq("id", meal.id);
      } else {
        resp = await supabase.from("meals").insert([payload]);
      }
      setSaving(false);
      if (resp.error) setError(resp.error.message);
      else onClose();
    }

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.19)", zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <form onSubmit={handleSave} style={{
          background: "#fff", borderRadius: 14, padding: 32, minWidth: 300, maxWidth: 460,
          boxShadow: "0 8px 32px #5d518151", color: "#222"
        }}>
          <h2>{editing ? "Edit" : "Plan New"} Meal</h2>
          <div style={{ margin: "12px 0" }}>
            <label>Type:{" "}
              <select value={type} onChange={e => setType(e.target.value)} required>
                <option>Dinner</option>
                <option>Lunch</option>
                <option>Breakfast</option>
                <option>Brunch</option>
                <option>Snack</option>
                <option>Other</option>
              </select>
            </label>
          </div>
          <div style={{ margin: "12px 0" }}>
            <label>Date: {" "}
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </label>
            &nbsp;&nbsp;
            <label>Time:{" "}
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </label>
          </div>
          <div style={{ margin: "12px 0" }}>
            <label>Meal Title/Theme:{" "}
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%" }} />
            </label>
          </div>
          <div style={{ margin: "12px 0" }}>
            <label>Description:{" "}
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ width: "100%" }} />
            </label>
          </div>
          {error && <div style={{ color: "#c00" }}>{error}</div>}
          <button type="submit" className="btn" style={{ minWidth: 110 }} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Meal"}
          </button>
          <button type="button" className="btn" style={{ marginLeft: 18, background: "#888", color: "white" }} onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  // Meal Signup/Detail Modal
  function MealDetail({ meal, onClose }) {
    if (!meal) return null;
    const cookCount = participants.filter(p => p.meal_id === meal.id && p.role === "cook").length;
    const eaterCount = participants.filter(p => p.meal_id === meal.id && p.role === "eater").length;
    const cleanupCount = participants.filter(p => p.meal_id === meal.id && p.role === "cleanup").length;
    // Is current user signed up?
    const mine = user ? participants.find(p => p.meal_id === meal.id && p.user_id === user.id) : null;

    // Sign up/withdraw handler
    async function updateSignup(roleSel) {
      if (!user) return;
      // If same as current, withdraw, else upsert
      if (mine && mine.role === roleSel) {
        await supabase.from("meal_participants").delete().eq("id", mine.id);
      } else if (mine) {
        await supabase.from("meal_participants").update({ role: roleSel }).eq("id", mine.id);
      } else {
        await supabase.from("meal_participants").insert([{ meal_id: meal.id, user_id: user.id, role: roleSel }]);
      }
      setSelectedMeal(null);
    }

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.2)", zIndex: 22,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{
          background: "#fff", borderRadius: 16,
          minWidth: 330, maxWidth: 450, boxShadow: "0 2px 32px #8e6ec061", padding: 24
        }}>
          <h2>Meal: {meal.title || meal.type}</h2>
          <div style={{ fontSize: 16, color: "#444", marginBottom: 12 }}>
            <b>Date:</b> {meal.date ? (new Date(meal.date)).toLocaleString() : "-"}<br />
            <b>Type:</b> {meal.type}<br />
            {meal.description && (<><b>Description:</b> {meal.description}<br /></>)}
            <br />
            <b>Cooks:</b> {cookCount}, <b>Participants:</b> {eaterCount}, <b>Cleanup:</b> {cleanupCount}
          </div>
          {user && (
            <div style={{ margin: "16px 0" }}>
              <b>Sign up/role:</b> &nbsp;
              <button className="btn" style={{
                marginRight: 7,
                background: mine?.role === "cook" ? "#49b495" : "#ded"
              }} onClick={() => updateSignup("cook")}>Cook</button>
              <button className="btn" style={{
                marginRight: 7,
                background: mine?.role === "eater" ? "#9fc7fa" : "#dde"
              }} onClick={() => updateSignup("eater")}>Eat</button>
              <button className="btn" style={{
                background: mine?.role === "cleanup" ? "#f7b05b" : "#ffd"
              }} onClick={() => updateSignup("cleanup")}>Cleanup</button>
              {!!mine && (
                <button className="btn" style={{ marginLeft: 22, background: "#b2364d", color: "white" }} onClick={() => updateSignup(mine.role)}>
                  Withdraw
                </button>
              )}
            </div>
          )}
          <button className="btn" style={{ marginTop: 8, background: "#777", color: "white" }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // Shopping List Table/Task Board
  function ShoppingList() {
    if (!shoppingList.length) return (
      <div style={{ color: "#bbb", margin: 12 }}>
        No shopping tasks/items yet. Start a list below!
      </div>
    );
    return (
      <table style={{ width: "100%", marginTop: 8, background: "#f7fafd", borderRadius: 7 }}>
        <thead>
          <tr style={{ background: "#f2f0d6" }}>
            <th>Item</th>
            <th>Needed For</th>
            <th>Assigned</th>
            <th>Got it?</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {shoppingList.map(item => (
            <tr key={item.id} style={{ opacity: item.obtained ? 0.54 : 1 }}>
              <td>{item.item}</td>
              <td>{item.needed_for || "-"}</td>
              <td>{item.assigned_to || "-"}</td>
              <td>{item.obtained ? "✅" : ""}</td>
              <td>{item.notes || "-"}</td>
              <td>
                {/* Claim/unclaim, complete toggle only if authenticated */}
                {user && !item.assigned_to &&
                  <button className="btn" style={{ fontSize: 13 }} onClick={async () => {
                    await supabase.from("shopping_list").update({ assigned_to: user.email }).eq("id", item.id);
                    setAddShopItem(x => !x); // trigger reload
                  }}>Claim</button>
                }
                {user && item.assigned_to === user.email &&
                  <button className="btn" style={{ fontSize: 13, background: "#c2c" }} onClick={async () => {
                    await supabase.from("shopping_list").update({ assigned_to: null }).eq("id", item.id);
                    setAddShopItem(x => !x);
                  }}>Unclaim</button>
                }
                {user && (item.assigned_to === user.email || !item.assigned_to) &&
                  <button className="btn" style={{ fontSize: 13, background: "#3b9621" }} onClick={async () => {
                    await supabase.from("shopping_list").update({ obtained: !item.obtained }).eq("id", item.id);
                    setAddShopItem(x => !x);
                  }}>{item.obtained ? "Undo" : "Got it"}</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Add Shopping Item Form Modal
  function AddShoppingItem({ onClose }) {
    const [item, setItem] = useState("");
    const [neededFor, setNeededFor] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleAdd(e) {
      e.preventDefault();
      setSaving(true);
      if (!item) { setSaving(false); return; }
      await supabase.from("shopping_list").insert([{
        item, needed_for: neededFor, notes, created_by: user?.id || null, obtained: false
      }]);
      setSaving(false);
      onClose();
    }

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.15)", zIndex: 17, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <form onSubmit={handleAdd} style={{
          background: "#f7fafd", padding: 24, borderRadius: 12, minWidth: 310, boxShadow: "0 4px 18px #b7e8d1aa"
        }}>
          <h3>Add Shopping List Item</h3>
          <input type="text" placeholder="Item (e.g. eggs, ice)" required
            value={item} onChange={e => setItem(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
          <input type="text" placeholder="Needed for (meal/day/other)" value={neededFor}
            onChange={e => setNeededFor(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
          <input type="text" placeholder="Notes" value={notes}
            onChange={e => setNotes(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
          <button className="btn" type="submit" disabled={saving}>Add</button>
          <button className="btn" type="button" style={{ marginLeft: 10, background: "#888" }} onClick={onClose}>Cancel</button>
        </form>
      </div>
    );
  }

  // Dietary Info Form
  function DietaryInfoForm({ info, onClose }) {
    const [restrictions, setRestrictions] = useState(info?.restrictions || "");
    const [allergies, setAllergies] = useState(info?.allergies || "");
    const [notes, setNotes] = useState(info?.notes || "");
    const [saving, setSaving] = useState(false);

    async function handleSave(e) {
      e.preventDefault();
      setSaving(true);
      const payload = {
        user_id: user.id, restrictions, allergies, notes,
        created_at: new Date().toISOString()
      }
      // Upsert by user_id
      await supabase.from("dietary_info").upsert([payload], { onConflict: ["user_id"] });
      setSaving(false);
      onClose();
    }

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.15)", zIndex: 17, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <form onSubmit={handleSave} style={{
          background: "#fff", padding: 24, borderRadius: 12, minWidth: 310, boxShadow: "0 4px 18px #b7e8d1aa"
        }}>
          <h3>Your Dietary Info</h3>
          <label>
            Restrictions<br />
            <input type="text" value={restrictions} onChange={e => setRestrictions(e.target.value)} style={{ width: "100%" }}
              placeholder="Vegetarian/Vegan/Keto/etc" />
          </label>
          <br />
          <label>
            Allergies<br />
            <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)} style={{ width: "100%" }}
              placeholder="e.g. peanuts, gluten" />
          </label>
          <br />
          <label>
            Notes/Preferences<br />
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%" }}
              placeholder="Other dietary needs" />
          </label>
          <br />
          <button className="btn" type="submit" disabled={saving}>Save</button>
          <button className="btn" type="button" style={{ marginLeft: 10, background: "#888" }} onClick={onClose}>Cancel</button>
        </form>
      </div>
    );
  }

  // ---- PAGE MAIN RENDER ----

  return (
    <section className="container" style={{ maxWidth: 1100, margin: "auto", padding: 18 }}>
      <h1>Meals, Planning & Food Sharing</h1>
      <p>
        <strong>Coordinate communal meals, schedule your signups, and join shared shopping & cooking!</strong>
        Add meals to the schedule, sign up for jobs, and help the camp feast.<br />
        <span style={{ color: "#ab6f32" }}>Dietary needs? Enter them to help others plan inclusively.</span>
      </p>
      <div style={{
        margin: "18px 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12
      }}>
        <div>
          <button className="btn" onClick={() => setAddMealOpen(true)}>Add Meal to Schedule</button>
        </div>
        <div>
          <button className="btn" onClick={() => setShowDietForm(true)}>
            {myDiet ? "Edit Your Dietary Info" : "Add Dietary Info"}
          </button>
        </div>
      </div>

      {/* Meals Calendar */}
      <h2>Upcoming Meals</h2>
      <MealsScheduleTable />

      {!!selectedMeal && <MealDetail meal={selectedMeal} onClose={() => setSelectedMeal(null)} />}

      {!!addMealOpen && (
        <MealEditor
          meal={editMeal}
          onClose={() => {
            setAddMealOpen(false);
            setEditMeal(null);
          }}
        />
      )}

      <div style={{ margin: "32px 0 0 0" }}>
        <h2>Shared Shopping List & Food Supply Tasks</h2>
        <p>Collaboratively build the shopping list—claim or add items below. Anyone can help!</p>
        <button className="btn" style={{ marginBottom: 8 }} onClick={() => setAddShopItem(true)}>Add Item</button>
        <ShoppingList />
        {!!addShopItem && <AddShoppingItem onClose={() => setAddShopItem(false)} />}
      </div>

      {/* Dietary info (summary if exists) */}
      <div style={{
        margin: "38px 0 0 0", padding: "20px 16px", borderRadius: 10, background: "#f6f6fa",
        maxWidth: 500, fontSize: 15, color: "#335"
      }}>
        <b>Your Dietary/Priority Info:</b>
        <ul>
          <li><b>Restrictions:</b> {myDiet?.restrictions || <span style={{ color: "#bbb" }}>-</span>}</li>
          <li><b>Allergies:</b> {myDiet?.allergies || <span style={{ color: "#bbb" }}>-</span>}</li>
          <li><b>Notes:</b> {myDiet?.notes || <span style={{ color: "#bbb" }}>-</span>}</li>
        </ul>
      </div>
      {!!showDietForm && <DietaryInfoForm info={myDiet} onClose={() => setShowDietForm(false)} />}

      <div style={{ margin: "45px 0 14px 0", color: "#694", fontWeight: 500 }}>
        Want to try a special feast or themed night? All members can propose meals or add supply ideas.
      </div>
    </section>
  );
}

export default Meals;
