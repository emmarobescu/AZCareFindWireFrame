// filters.js — filtering + geocoding + replotting
document.addEventListener("DOMContentLoaded", () => {
  const locInput       = document.querySelector(".filter-input");
  const radiusInput    = document.querySelector(".radius-input");
  const careSelect     = document.querySelector(".care-select");
  const facilitySelect = document.querySelector(".facility-select");
  const searchBtn      = document.querySelector(".search-btn");
  const leftArrow      = document.querySelector(".radius-btn.left");
  const rightArrow     = document.querySelector(".radius-btn.right");

  if (!window.map || !window.markers) {
    console.warn("Map not ready — ensure map.js loads first");
    return;
  }

  // --- Detect incoming location query from homepage ---
  const urlParams = new URLSearchParams(window.location.search);
  const startLocation = urlParams.get("location");

  if (startLocation) {
    const locInput = document.querySelector(".filter-input");
    if (locInput) {
      locInput.value = decodeURIComponent(startLocation);
      // Wait a moment for map.js to initialize, then trigger search automatically
      setTimeout(() => {
        const searchBtn = document.querySelector(".search-btn");
        if (searchBtn) searchBtn.click();
      }, 800);
    }
  }

  // Radius: start at 1, then 5-step increments
  function adjustRadius(delta) {
    let val = parseInt(radiusInput.value || "1", 10);
    if (val === 1 && delta > 0) val = 0; // 1 → 5 first jump
    const newVal = Math.max(1, Math.min(50, val + delta * 5));
    radiusInput.value = newVal;
  }
  leftArrow?.addEventListener("click", () => adjustRadius(-1));
  rightArrow?.addEventListener("click", () => adjustRadius(1));

  const toKm = miles => miles * 1.60934;
  function distanceKm(a,b,c,d) {
    const R=6371, dLat=(c-a)*Math.PI/180, dLon=(d-b)*Math.PI/180;
    const u = Math.sin(dLat/2)**2 +
      Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(u));
  }

  // Geocode with local dataset preference
  async function geocode(q, data) {
    const clean = q.trim();
    const upper = clean.toUpperCase();
    const isZip = /^\d{5}$/.test(clean);

    // Try local CITY / ZIP first
    const matches = data.filter(f => {
      const city = (f.CITY || "").toUpperCase();
      const zip  = (f.N_ZIP || f.ZIP || "").toString();
      return city === upper || zip === clean;
    });
    if (matches.length) {
      const avgLat = matches.reduce((s,f)=>s+parseFloat(f.N_LAT),0)/matches.length;
      const avgLon = matches.reduce((s,f)=>s+parseFloat(f.N_LON),0)/matches.length;
      return { lat: avgLat, lng: avgLon };
    }

    // Fallback APIs
    if (isZip) {
      const r = await fetch(`https://api.zippopotam.us/us/${clean}`);
      const j = await r.json();
      return { lat:+j.places[0].latitude, lng:+j.places[0].longitude };
    } else {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(clean)}`;
      const r = await fetch(url);
      const j = await r.json();
      if (!j.length) throw new Error("Location not found");
      return { lat:+j[0].lat, lng:+j[0].lon };
    }
  }

  // Update markers on the map after filtering
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

      const m = L.marker([lat, lon]);
      m.bindPopup(`
        <strong>${f.FACILITY_NAME || "Unknown Facility"}</strong><br>
        ${f.ADDRESS || ""}<br>
        ${f.CITY || ""}
      `);

      // <<< IMPORTANT: keep info panel working after filters
      if (window.attachMarkerClick) window.attachMarkerClick(m, f);

      window.markers.addLayer(m);
    });

    window.map.addLayer(window.markers);
    if (window.markers.getLayers().length) {
      window.map.fitBounds(window.markers.getBounds().pad(0.2));
    }
  }

  // Search click → filter data
  searchBtn?.addEventListener("click", async () => {
    const locRaw  = (locInput.value || "").trim();
    const radius  = parseFloat(radiusInput.value || "0");
    const careVal = careSelect.value;
    const sizeVal = facilitySelect.value;

    const data = await fetch("data/facilities.json").then(r=>r.json());

    let center, rKm;
    if (locRaw) {
      try {
        center = await geocode(locRaw, data);
        rKm = toKm(radius);
      } catch {
        alert("Location not found.");
        return;
      }
    }

    const filtered = data.filter(f => {
      const name = (f.FACILITY_NAME || "").toUpperCase();
      const type = (f.TYPE || "").toUpperCase();
      const sub  = (f.SUBTYPE || "").toUpperCase();

      // Care type
      let ok = true;
      if (careVal === "behavioral-health") ok = type.includes("BEHAVIORAL") || sub.includes("BEHAVIORAL");
      else if (careVal === "assisted")     ok = type.includes("ASSISTED LIVING");
      else if (careVal === "memory")       ok = name.includes("MEMORY") || sub.includes("MEMORY");
      if (!ok) return false;

      // Facility size
      const cap = parseInt(f.CAPACITY_INT || f.Capacity || 0, 10);
      if (sizeVal === "residential" && cap > 12) return false;
      if (sizeVal === "facility"    && cap <= 12) return false;

      // Radius
      if (locRaw && rKm) {
        const la = parseFloat(f.N_LAT), lo = parseFloat(f.N_LON);
        if (isNaN(la) || isNaN(lo)) return false;
        if (distanceKm(center.lat, center.lng, la, lo) > rKm) return false;
      }

      return true;
    });

    updateMarkers(filtered);
  });
});
