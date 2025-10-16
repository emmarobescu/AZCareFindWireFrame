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
function getPriceEstimate(f) {
  const name = (f.FACILITY_NAME || "").toUpperCase();
  const type = (f.TYPE || "").toUpperCase();
  const sub  = (f.SUBTYPE || f.LICENSE_SUBTYPE || "").toUpperCase();
  const cap  = parseInt(f.CAPACITY_INT || f.Capacity || 0, 10);

  // --- MEMORY CARE ---
  if (name.includes("MEMORY")) {
    if (cap < 20) {
      return "$5,500 – $9,000";
    } else {
      return "Private: $7,000 – $10,000 | Semi-Private: $5,500 – $7,000";
    }
  }

  // --- ASSISTED LIVING HOME ---
  if (type.includes("ASSISTED LIVING HOME")) {
    return "Private: $4,500 – $6,000 | Semi-Private: $2,800 – $4,000";
  }

  // --- ASSISTED LIVING CENTER ---
  if (type.includes("ASSISTED LIVING CENTER")) {
    return "Studio: $3,000 + Level of Care ($0–$2,000) • 1 Bed: $3,500 + Level of Care • 2 Bed: $4,000 + Level of Care";
  }

  // --- BEHAVIORAL HEALTH RESIDENTIAL ---
  if (type.includes("BH RESIDENTIAL") || sub.includes("BEHAVIORAL")) {
    return "Private: $7,000 – $10,000 | Semi-Private: $4,000 – $8,000";
  }

  // Fallback
  return "N/A";
}


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
    const priceEl = document.getElementById("info-price"); // <— Added

    if (nameEl)  nameEl.textContent  = toTitleCase(facility.FACILITY_NAME) || "N/A";
    if (addrEl)  addrEl.textContent  =
      `${toTitleCase(facility.ADDRESS || "")}${
        facility.CITY ? ", " + toTitleCase(facility.CITY) : ""
      } ${facility.ZIP || ""}`.trim() || "N/A";
    if (phoneEl) phoneEl.textContent = facility.Telephone || "N/A";
    if (capEl)   capEl.textContent   = facility.Capacity || "N/A";
    if (typeEl)  typeEl.textContent  = toTitleCase(facility.TYPE) || "N/A";
    if (subEl)   subEl.textContent   = extractLevelOfCare(facility.LICENSE_SUBTYPE) || "N/A";

    // --- PRICE ESTIMATE INJECTION ---
    if (priceEl) priceEl.textContent = getPriceEstimate(facility);
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


function updateMarkers(list) {
  // Clear current markers
  markers.clearLayers();

  if (!list.length) {
    alert("No facilities match your criteria.");
    return;
  }

  // Re-add markers for each facility in the list
  list.forEach(f => {
    const lat = parseFloat(f.N_LAT);
    const lon = parseFloat(f.N_LON);
    if (!lat || !lon) return;

    const marker = L.marker([lat, lon]);
    marker.bindPopup(`
      <strong>${f.FACILITY_NAME || "Unknown Facility"}</strong><br>
      ${f.ADDRESS || ""}<br>
      ${f.CITY || ""}
    `);

    attachMarkerClick(marker, f);
    markers.addLayer(marker);
  });

  map.addLayer(markers);

  // Zoom map to the new marker bounds
  if (markers.getLayers().length) {
    map.fitBounds(markers.getBounds().pad(0.2));
  }
}
// =====================
// Assessment → Map fallback loader (final fixed version)
// =====================
window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const careLevel = (urlParams.get("level") || "").toUpperCase();
  const preferredZip = (urlParams.get("location") || "").trim();

  // Only run when coming from the assessment
  if (!careLevel || !preferredZip) return;

  const data = await fetch("data/facilities.json").then(r => r.json());

  // --- Care-level filtering ---
  let filtered = data.filter(f => {
    const name = (f.FACILITY_NAME || "").toUpperCase();
    const type = (f.TYPE || "").toUpperCase();
    const subtype = (f.SUBTYPE || f.LICENSE_SUBTYPE || "").toUpperCase();
    const cap = parseInt(f.CAPACITY_INT || f.Capacity || 0, 10);

    if (careLevel.includes("MEMORY")) {
      // memory care logic
      if (name.includes("MEMORY")) return true;
      if (type.includes("ASSISTED LIVING") && cap >= 20) return true;
      return false;
    }

    if (careLevel.includes("BEHAVIORAL")) {
      return type.includes("BH RESIDENTIAL") || type.includes("BEHAVIORAL");
    }

    if (careLevel.includes("PERSONAL") || careLevel.includes("DIRECTED") || careLevel.includes("SUPERVISORY")) {
      return type.includes("ASSISTED LIVING");
    }

    // default fallback
    return true;
  });

  // --- ZIP filtering (preferred → nearby → all) ---
  let resultsInZip = filtered.filter(f => {
    const zip = (f.ZIP || f.N_ZIP || "").toString().trim();
    return zip.startsWith(preferredZip);
  });

  let finalResults = resultsInZip;

  if (resultsInZip.length === 0 && preferredZip) {
    const prefix = preferredZip.slice(0, 3); // e.g. 853 for 85381
    finalResults = filtered.filter(f => {
      const zip = (f.ZIP || f.N_ZIP || "").toString().trim();
      return zip.startsWith(prefix);
    });

    if (finalResults.length > 0) {
      alert(`No ${careLevel} facilities were found in ZIP ${preferredZip}. Showing nearby results instead.`);
    } else {
      alert(`No ${careLevel} facilities found near ${preferredZip}. Showing all available results.`);
      finalResults = filtered;
    }
  }

  // --- Plot results ---
  updateMarkers(finalResults);
});


