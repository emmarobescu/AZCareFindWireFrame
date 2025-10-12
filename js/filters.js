// scripts/filter.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("filter.js fully active");

  // ---- Element references ----
  const searchBtn = document.querySelector(".search-btn");
  const locInput = document.querySelector(".filter-input");
  const radiusInput = document.querySelector(".radius-input");
  const careSelect = document.querySelector(".care-select");
  const facilitySelect = document.querySelector(".facility-select");
  const leftArrow = document.querySelector(".radius-btn.left");
  const rightArrow = document.querySelector(".radius-btn.right");

  // ---- Check map availability ----
  if (!window.map || !window.markers) {
    console.warn("Map or markers not found — make sure map.js loads before filter.js");
    return;
  }

  // ================================================================
  // ========== 1️⃣  Radius adjustment buttons ======================
  // ================================================================
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

  // ---- Helpers ----
  const toKm = miles => miles * 1.60934;
  function distanceKm(a, b, c, d) {
    const R = 6371;
    const dLat = (c - a) * Math.PI / 180;
    const dLon = (d - b) * Math.PI / 180;
    const u =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a * Math.PI / 180) *
        Math.cos(c * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(u));
  }

  // ================================================================
  // ========== 2️⃣  Geocode with local city/zip match ===============
  // ================================================================
  async function geocode(q, data) {
    const clean = q.trim().toUpperCase();
    const isZip = /^\d{5}$/.test(clean);

    // Try to match CITY or ZIP in your dataset first
    const matches = data.filter(f => {
      const city = (f.CITY || "").toUpperCase();
      const zip = (f.N_ZIP || f.ZIP || "").toString();
      return city === clean || zip === clean;
    });

    if (matches.length > 0) {
      const avgLat =
        matches.reduce((sum, f) => sum + parseFloat(f.N_LAT), 0) /
        matches.length;
      const avgLon =
        matches.reduce((sum, f) => sum + parseFloat(f.N_LON), 0) /
        matches.length;
      console.log(`Found local match for "${clean}" in dataset (${matches.length} facilities)`);
      return { lat: avgLat, lng: avgLon };
    }

    // Fallback: external APIs
    try {
      if (isZip) {
        const res = await fetch(`https://api.zippopotam.us/us/${clean}`);
        const data = await res.json();
        return {
          lat: +data.places[0].latitude,
          lng: +data.places[0].longitude,
        };
      } else {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          q
        )}`;
        const res = await fetch(url);
        const geo = await res.json();
        if (!geo.length) throw new Error("City not found");
        return { lat: +geo[0].lat, lng: +geo[0].lon };
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      throw new Error("Location not found");
    }
  }

  // ================================================================
  // ========== 3️⃣  Search button logic =============================
  // ================================================================
  searchBtn?.addEventListener("click", async () => {
    console.log("Search clicked");

    const locRaw = locInput.value.trim();
    const radius = parseFloat(radiusInput.value);
    const careVal = careSelect.value;
    const sizeVal = facilitySelect.value;

    let center, rKm;

    // Load dataset once for both local match & filtering
    const data = await fetch("data/facilities.json").then(r => r.json());

    // ---- Determine center & radius ----
    if (locRaw) {
      try {
        center = await geocode(locRaw, data);
        rKm = toKm(radius);
      } catch {
        alert("Location not found");
        return;
      }
    }

    // ---- Filter dataset ----
    const filtered = data.filter(f => {
      const name = (f.FACILITY_NAME || "").toUpperCase();
      const type = (f.TYPE || "").toUpperCase();
      const sub = (f.SUBTYPE || "").toUpperCase();

      // Care type filter
      let ok = true;
      if (careVal === "behavioral-health")
        ok = type.includes("BEHAVIORAL") || sub.includes("BEHAVIORAL");
      else if (careVal === "assisted")
        ok = type.includes("ASSISTED LIVING");
      else if (careVal === "memory")
        ok = name.includes("MEMORY") || sub.includes("MEMORY");
      if (!ok) return false;

      // Facility size filter
      const cap = parseInt(f.CAPACITY_INT || f.Capacity || 0, 10);
      if (sizeVal === "residential" && cap > 12) return false;
      if (sizeVal === "facility" && cap <= 12) return false;

      // Location / radius filter
      if (locRaw && rKm) {
        const la = parseFloat(f.N_LAT),
          lo = parseFloat(f.N_LON);
        if (isNaN(la) || isNaN(lo)) return false;
        if (distanceKm(center.lat, center.lng, la, lo) > rKm) return false;
      }

      return true;
    });

    // ---- Update map ----
    updateMarkers(filtered);
  });

  // ================================================================
  // ========== 4️⃣  Marker refresh =================================
  // ================================================================
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
