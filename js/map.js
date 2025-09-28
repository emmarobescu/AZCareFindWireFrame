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

    // Add clustered markers to map
    map.addLayer(markers);
  })
  .catch(err => console.error("Error loading facilities.json:", err));
