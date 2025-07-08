import React from "react";

/**
 * Visual colored dot/label for crew status: onsite, pending, departed, etc.
 * Accepts arrival and departure ISO strings, and optional size and label.
 */
// PUBLIC_INTERFACE
function CrewStatusIndicator({ arrival, departure, size = 15, showLabel = false }) {
  const now = new Date();
  let label = "No Data";
  let color = "#aaa";
  if (arrival) {
    const arr = new Date(arrival);
    const dep = departure ? new Date(departure) : null;
    if (dep && now > dep) {
      label = "Departed"; color = "#72604e";
    } else if (now < arr) {
      label = "Pending"; color = "#fab006";
    } else if (!dep || now < dep) {
      label = "On Site"; color = "#32cd7e";
    }
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontWeight: 600, fontSize: 14
    }}>
      <span style={{
        display: "inline-block",
        borderRadius: "50%",
        background: color,
        width: size,
        height: size,
        marginRight: showLabel ? 6 : 0,
      }} title={label} />
      {showLabel && <span style={{ color }}>{label}</span>}
    </span>
  );
}

export default CrewStatusIndicator;
