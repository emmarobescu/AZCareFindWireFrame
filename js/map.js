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

        markers.addLayer(marker);
      }
    });
    marker.on('click', () => {
  const container = document.querySelector('.map-container');
  container.classList.add('info-open');
  container.classList.remove('sidebar-open');

  // Hide default message and show facility details
  document.getElementById('info-default').style.display = 'none';
  document.getElementById('facility-details').style.display = 'block';

  // Fill in details
  document.getElementById('info-name').textContent = facility.FACILITY_NAME || "N/A";
  document.getElementById('info-address').textContent =
    `${facility.ADDRESS || ""}, ${facility.CITY || ""} ${facility.ZIP || ""}`;
  document.getElementById('info-phone').textContent = facility.Telephone || "N/A";
  document.getElementById('info-capacity').textContent = facility.Capacity || "N/A";
  document.getElementById('info-type').textContent = facility.TYPE || "N/A";
  document.getElementById('info-subtype').textContent = facility.SUBTYPE || "N/A";
});


    // Add clustered markers to map
    map.addLayer(markers);
  })
  .catch(err => console.error("Error loading facilities.json:", err));

window.map = map;
window.markers = markers;

