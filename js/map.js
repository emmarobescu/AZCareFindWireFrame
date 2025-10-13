// Initialize Leaflet map
const map = L.map('map', {
  center: [34.0489, -111.0937], // Arizona center
  zoom: 7,
  zoomControl: false
});

// OSM tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// Zoom controls (bottom-right)
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Cluster group
const markers = L.markerClusterGroup();

/* =============================== *
 * Helpers (formatting + info side)
 * =============================== */

// Title Case (with small-word exceptions)
function toTitleCase(str) {
  if (typeof str !== "string" || !str.trim()) return "";
  const exceptions = ["of","and","in","on","at","for","to","with","a","an","the"];
  return str
    .toLowerCase()
    .split(" ")
    .map((w,i) => (exceptions.includes(w) && i !== 0) ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// LICENSE_SUBTYPE → Level of Care
function extractLevelOfCare(subtype) {
  if (!subtype || typeof subtype !== "string") return "";
  const parts = subtype.split("-");
  let level = parts[1] ? parts[1].trim() : "";
  if (/adult/i.test(level)) return "Adult Care";
  if (/child/i.test(level)) return "Child Care";
  return toTitleCase(level);
}

// Attach click → open info panel + fill details
function attachMarkerClick(marker, facility) {
  marker.on("click", () => {
    const container = document.querySelector(".map-container");
    container.classList.add("info-open");
    container.classList.remove("sidebar-open");

    // Hide default message, show details
    const defaultMsg = document.getElementById("info-default");
    const detailsBox = document.getElementById("facility-details");
    if (defaultMsg) defaultMsg.style.display = "none";
    if (detailsBox) detailsBox.style.display = "block";

    // Fill details
    const nameEl = document.getElementById("info-name");
    const addrEl = document.getElementById("info-address");
    const phoneEl = document.getElementById("info-phone");
    const capEl = document.getElementById("info-capacity");
    const typeEl = document.getElementById("info-type");
    const subEl  = document.getElementById("info-subtype");

    if (nameEl)  nameEl.textContent  = toTitleCase(facility.FACILITY_NAME) || "N/A";
    if (addrEl)  addrEl.textContent  =
      `${toTitleCase(facility.ADDRESS || "")}${
        facility.CITY ? ", " + toTitleCase(facility.CITY) : ""
      } ${facility.ZIP || ""}`.trim() || "N/A";
    if (phoneEl) phoneEl.textContent = facility.Telephone || "N/A";
    if (capEl)   capEl.textContent   = facility.Capacity || "N/A";
    if (typeEl)  typeEl.textContent  = toTitleCase(facility.TYPE) || "N/A";
    if (subEl)   subEl.textContent   = extractLevelOfCare(facility.LICENSE_SUBTYPE) || "N/A";
  });
}

/* =============================== *
 * Initial load of all facilities
 * =============================== */
fetch("data/facilities.json")
  .then(r => r.json())
  .then(data => {
    data.forEach(facility => {
      const lat = facility.N_LAT;
      const lon = facility.N_LON;
      if (!lat || !lon) return;

      const marker = L.marker([lat, lon]);

      marker.bindPopup(`
        <strong>${facility.FACILITY_NAME || "Unknown Facility"}</strong><br>
        ${facility.ADDRESS || ""}<br>
        ${facility.CITY || ""}
      `);

      attachMarkerClick(marker, facility);
      markers.addLayer(marker);
    });

    map.addLayer(markers);
  })
  .catch(err => console.error("Error loading facilities.json:", err));

// Expose for filters.js
window.map = map;
window.markers = markers;
window.attachMarkerClick = attachMarkerClick;
window.toTitleCase = toTitleCase;
window.extractLevelOfCare = extractLevelOfCare;

