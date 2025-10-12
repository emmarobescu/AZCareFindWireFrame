// scripts/filters.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("filters.js fully active");

  // Elements
  const searchBtn = document.querySelector(".search-btn");
  const locInput = document.querySelector(".filter-input");
  const radiusInput = document.querySelector(".radius-input");
  const careSelect = document.querySelector(".care-select");
  const facilitySelect = document.querySelector(".facility-select");
  const leftArrow = document.querySelector(".radius-btn.left");
  const rightArrow = document.querySelector(".radius-btn.right");

  // Make sure map exists
  if (!window.map || !window.markers) {
    console.warn("Map or markers not found — make sure map.js loads before filters.js");
    return;
  }

 // ---- Radius adjustment buttons ----
function adjustRadius(delta) {
  let val = parseInt(radiusInput.value || "1", 10);

  // first jump: 1 → 5
  if (val === 1 && delta > 0) val = 0;

  // move in 5-mile steps but never below 1 or above 50
  const newVal = Math.max(1, Math.min(50, val + delta * 5));
  radiusInput.value = newVal;
}

leftArrow?.addEventListener("click", () => adjustRadius(-1));
rightArrow?.addEventListener("click", () => adjustRadius(1));


  // ---- Convert miles to kilometers ----
  const toKm = miles => miles * 1.60934;

  // ---- Haversine distance ----
  function distanceKm(a, b, c, d) {
    const R = 6371;
    const dLat = (c - a) * Math.PI / 180;
    const dLon = (d - b) * Math.PI / 180;
    const u = Math.sin(dLat / 2) ** 2 +
              Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(u));
  }

  // ---- Geocoding helper ----
  async function geocode(q) {
    const clean = q.trim(),
      isZip = /^\d{5}$/.test(clean),
      url = isZip
        ? `https://api.zippopotam.us/us/${clean}`
        : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}`,
      res = await fetch(url),
      data = await res.json();

    if (isZip) {
      return { lat: +data.places[0].latitude, lng: +data.places[0].longitude };
    }
    if (!data.length) throw new Error("Location not found");
    return { lat: +data[0].lat, lng: +data[0].lon };
  }

  // ---- Search button click ----
  searchBtn?.addEventListener("click", async () => {
    console.log("Search clicked");

    const locRaw = locInput.value.trim();
    const radius = parseFloat(radiusInput.value);
    const careVal = careSelect.value;
    const sizeVal = facilitySelect.value;

    let center, rKm;
    if (locRaw) {
      try {
        center = await geocode(locRaw);
        rKm = toKm(radius);
      } catch {
        alert("Location not found");
        return;
      }
    }

    fetch("data/facilities.json")
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(f => {
          const name = (f.FACILITY_NAME || "").toUpperCase();
          const type = (f.TYPE || "").toUpperCase();
          const sub = (f.SUBTYPE || "").toUpperCase();

          // Filter by care type
          let ok = true;
          if (careVal === "behavioral-health")
            ok = type.includes("BEHAVIORAL") || sub.includes("BEHAVIORAL");
          else if (careVal === "assisted")
            ok = type.includes("ASSISTED LIVING");
          else if (careVal === "memory")
            ok = name.includes("MEMORY") || sub.includes("MEMORY");
          if (!ok) return false;

          // Filter by facility size
          const cap = parseInt(f.CAPACITY_INT || f.Capacity || 0, 10);
          if (sizeVal === "residential" && cap > 12) return false;
          if (sizeVal === "facility" && cap <= 12) return false;

          // Filter by location / radius
          if (locRaw && rKm) {
            const la = parseFloat(f.N_LAT), lo = parseFloat(f.N_LON);
            if (isNaN(la) || isNaN(lo)) return false;
            if (distanceKm(center.lat, center.lng, la, lo) > rKm) return false;
          }

          return true;
        });

        updateMarkers(filtered);
      })
      .catch(err => {
        console.error("Filter error:", err);
        alert("Something went wrong while filtering.");
      });
  });

  // ---- Update markers on map ----
  function updateMarkers(list) {
    window.markers.clearLayers();

    if (!list.length) {
      alert("No facilities match your filters.");
      return;
    }

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
      window.markers.addLayer(marker);
    });

    window.map.addLayer(window.markers);
    if (window.markers.getLayers().length)
      window.map.fitBounds(window.markers.getBounds().pad(0.2));
  }
});

