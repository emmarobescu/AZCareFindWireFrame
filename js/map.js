// Initialize Leaflet map
const map = L.map('map', {
  center: [34.0489, -111.0937], // Arizona center
  zoom: 7,
  zoomControl: false // remove default zoom buttons
});

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// Add zoom controls back (bottom right so they don’t overlap filter/info box)
L.control.zoom({
  position: 'bottomright'
}).addTo(map);

// Create a cluster group
const markers = L.markerClusterGroup();

// ---- Helper: Convert ALL CAPS to Title Case ----
function toTitleCase(str) {
  if (typeof str !== "string" || !str.trim()) return ""; // return empty if blank or not string
  const exceptions = ["of", "and", "in", "on", "at", "for", "to", "with", "a", "an", "the"];
  return str
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (exceptions.includes(word) && index !== 0) return word; // don't capitalize short words unless first
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// ---- Helper: Extract level of care from LICENSE_SUBTYPE ----
function extractLevelOfCare(subtype) {
  if (!subtype || typeof subtype !== "string") return "";

  const parts = subtype.split("-");
  let level = parts[1] ? parts[1].trim() : "";

  if (/adult/i.test(level)) return "Adult Care";
  if (/child/i.test(level)) return "Child Care";

  return toTitleCase(level);
}

// Load facilities data from your JSON file
fetch('data/facilities.json') // adjust path if JSON isn’t in /data
  .then(response => response.json())
  .then(data => {
    data.forEach(facility => {
      const lat = facility.N_LAT;
      const lon = facility.N_LON;

      if (lat && lon) {
        const name = facility.FACILITY_NAME || "Unknown Facility";
        const city = facility.CITY || "Unknown City";
        const address = facility.ADDRESS || "";

        // Create marker
        const marker = L.marker([lat, lon]);

        // Popup with details
        marker.bindPopup(`
          <strong>${name}</strong><br>
          ${address}<br>
          ${city}
        `);

        // ---- Attach click event inside loop ----
        marker.on('click', () => {
          const container = document.querySelector('.map-container');
          container.classList.add('info-open');
          container.classList.remove('sidebar-open');

          // Hide default message and show facility details
          document.getElementById('info-default').style.display = 'none';
          document.getElementById('facility-details').style.display = 'block';

          // Fill in details
         // Fill in details
document.getElementById('info-name').textContent =
  toTitleCase(facility.FACILITY_NAME) || "N/A";
document.getElementById('info-address').textContent =
  `${toTitleCase(facility.ADDRESS || "")}${facility.CITY ? ", " + toTitleCase(facility.CITY) : ""} ${facility.ZIP || ""}`.trim() || "N/A";
document.getElementById('info-phone').textContent = facility.Telephone || "N/A";
document.getElementById('info-capacity').textContent = facility.Capacity || "N/A";
document.getElementById('info-type').textContent =
  toTitleCase(facility.TYPE) || "N/A";
document.getElementById('info-subtype').textContent =
  extractLevelOfCare(facility.LICENSE_SUBTYPE) || "N/A";



        });

        // Add marker to cluster group
        markers.addLayer(marker);
      }
    });

    // Add clustered markers to map
    map.addLayer(markers);
  })
  .catch(err => console.error("Error loading facilities.json:", err));

window.map = map;
window.markers = markers;
