// =============================================
//  MAP INITIALIZATION
// =============================================
const map = L.map("map", {
  center: [34.0489, -111.0937], // Arizona center
  zoom: 7,
  zoomControl: false,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

L.control.zoom({ position: "bottomright" }).addTo(map);

const markers = L.markerClusterGroup();

// =============================================
//  HELPER FUNCTIONS
// =============================================
function getPriceEstimate(f) {
  const name = (f.FACILITY_NAME || "").toUpperCase();
  const type = (f.TYPE || "").toUpperCase();
  const sub = (f.SUBTYPE || f.LICENSE_SUBTYPE || "").toUpperCase();
  const cap = parseInt(f.CAPACITY_INT || f.Capacity || 0, 10);

  if (name.includes("MEMORY")) {
    if (cap < 20) return "$5,500 – $9,000";
    return "Private: $7,000 – $10,000 | Semi-Private: $5,500 – $7,000";
  }

  if (type.includes("ASSISTED LIVING HOME"))
    return "Private: $4,500 – $6,000 | Semi-Private: $2,800 – $4,000";

  if (type.includes("ASSISTED LIVING CENTER"))
    return "Studio: $3,000 + Level of Care ($0–$2,000) • 1 Bed: $3,500 + Level of Care • 2 Bed: $4,000 + Level of Care";

  if (type.includes("BH RESIDENTIAL") || sub.includes("BEHAVIORAL"))
    return "Private: $7,000 – $10,000 | Semi-Private: $4,000 – $8,000";

  return "N/A";
}

function toTitleCase(str) {
  if (typeof str !== "string" || !str.trim()) return "";
  const exceptions = ["of", "and", "in", "on", "at", "for", "to", "with", "a", "an", "the"];
  return str
    .toLowerCase()
    .split(" ")
    .map((w, i) =>
      exceptions.includes(w) && i !== 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

function extractLevelOfCare(subtype) {
  if (!subtype || typeof subtype !== "string") return "";
  const parts = subtype.split("-");
  let level = parts[1] ? parts[1].trim() : "";
  if (/adult/i.test(level)) return "Adult Care";
  if (/child/i.test(level)) return "Child Care";
  return toTitleCase(level);
}

function attachMarkerClick(marker, facility) {
  marker.on("click", () => {
    const container = document.querySelector(".map-container");
    if (container) {
      container.classList.add("info-open");
      container.classList.remove("sidebar-open");
    }

    const defaultMsg = document.getElementById("info-default");
    const detailsBox = document.getElementById("facility-details");
    if (defaultMsg) defaultMsg.style.display = "none";
    if (detailsBox) detailsBox.style.display = "block";

    const nameEl = document.getElementById("info-name");
    const addrEl = document.getElementById("info-address");
    const phoneEl = document.getElementById("info-phone");
    const capEl = document.getElementById("info-capacity");
    const typeEl = document.getElementById("info-type");
    const subEl = document.getElementById("info-subtype");
    const priceEl = document.getElementById("info-price");

    if (nameEl) nameEl.textContent = toTitleCase(facility.FACILITY_NAME) || "N/A";
    if (addrEl)
      addrEl.textContent =
        `${toTitleCase(facility.ADDRESS || "")}${
          facility.CITY ? ", " + toTitleCase(facility.CITY) : ""
        } ${facility.ZIP || ""}`.trim() || "N/A";
    if (phoneEl) phoneEl.textContent = facility.Telephone || "N/A";
    if (capEl) capEl.textContent = facility.Capacity || "N/A";
    if (typeEl) typeEl.textContent = toTitleCase(facility.TYPE) || "N/A";
    if (subEl)
      subEl.textContent = extractLevelOfCare(facility.LICENSE_SUBTYPE) || "N/A";
    if (priceEl) priceEl.textContent = getPriceEstimate(facility);
  });
}

// =============================================
//  INITIAL FACILITY LOAD
// =============================================
fetch("data/facilities.json")
  .then((r) => r.json())
  .then((data) => {
    data.forEach((facility) => {
      const lat = facility.N_LAT;
      const lon = facility.N_LON;
      if (!lat || !lon) return;

      const marker = L.marker([lat, lon]);
      marker.bindPopup(
        `<strong>${facility.FACILITY_NAME || "Unknown Facility"}</strong><br>
         ${facility.ADDRESS || ""}<br>${facility.CITY || ""}`
      );
      attachMarkerClick(marker, facility);
      markers.addLayer(marker);
    });
    map.addLayer(markers);
  })
  .catch((err) => console.error("Error loading facilities.json:", err));

// expose to other scripts
window.map = map;
window.markers = markers;
window.attachMarkerClick = attachMarkerClick;
window.toTitleCase = toTitleCase;
window.extractLevelOfCare = extractLevelOfCare;

// =============================================
//  UPDATE MARKERS FUNCTION
// =============================================
function updateMarkers(list) {
  markers.clearLayers();
  if (!list.length) {
    alert("No facilities match your criteria. Try increasing the mile radius or broadening your search area.");
    return;
  }

  list.forEach((f) => {
    const lat = parseFloat(f.N_LAT);
    const lon = parseFloat(f.N_LON);
    if (!lat || !lon) return;

    const marker = L.marker([lat, lon]);
    marker.bindPopup(
      `<strong>${f.FACILITY_NAME || "Unknown Facility"}</strong><br>
       ${f.ADDRESS || ""}<br>${f.CITY || ""}`
    );
    attachMarkerClick(marker, f);
    markers.addLayer(marker);
  });

  map.addLayer(markers);
  if (markers.getLayers().length) map.fitBounds(markers.getBounds().pad(0.2));
}

// =============================================
//  ASSESSMENT → MAP AUTO-LOADER
// =============================================
window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const careLevel = (urlParams.get("level") || "").toUpperCase();
  const preferredZip = (urlParams.get("location") || "").trim();

  if (!careLevel || !preferredZip) return;

  const data = await fetch("data/facilities.json").then((r) => r.json());

  // ---- Care-level filtering ----
  const filtered = data.filter((f) => {
    const name = (f.FACILITY_NAME || "").toUpperCase();
    const type = (f.TYPE || "").toUpperCase();
    const subtype = (f.SUBTYPE || f.LICENSE_SUBTYPE || "").toUpperCase();

    // MEMORY CARE
    if (careLevel.includes("MEMORY")) {
      return name.includes("MEMORY") || type.includes("MEMORY") || subtype.includes("MEMORY");
    }

    // BEHAVIORAL HEALTH
    if (careLevel.includes("BEHAVIORAL")) {
      return (
        type.includes("BH RESIDENTIAL") ||
        type.includes("BEHAVIORAL") ||
        subtype.includes("BEHAVIORAL")
      );
    }

    // ASSISTED LIVING (Personal, Directed, Supervisory)
    if (
      careLevel.includes("PERSONAL") ||
      careLevel.includes("DIRECTED") ||
      careLevel.includes("SUPERVISORY")
    ) {
      return type.includes("ASSISTED LIVING");
    }

    return false;
  });

  // ---- ZIP filtering (preferred → nearby → all) ----
  let resultsInZip = filtered.filter((f) => {
    const zip = (f.ZIP || f.N_ZIP || "").toString().trim();
    return zip.startsWith(preferredZip);
  });

  let finalResults = resultsInZip;

  if (resultsInZip.length === 0 && preferredZip) {
    const prefix = preferredZip.slice(0, 3);
    finalResults = filtered.filter((f) => {
      const zip = (f.ZIP || f.N_ZIP || "").toString().trim();
      return zip.startsWith(prefix);
    });

    if (finalResults.length > 0) {
      alert(`No ${careLevel} facilities were found in ZIP ${preferredZip}. Showing nearby results instead.`);
    } else {
      alert(`No ${careLevel} facilities found near ${preferredZip}. Showing all ${careLevel} results.`);
      finalResults = filtered;
    }
  }
  updateMarkers(finalResults);
});
