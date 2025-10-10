// scripts/filters.js
document.addEventListener("DOMContentLoaded", () => {
  const locInput       = document.querySelector(".filter-input");
  const radiusInput    = document.querySelector(".radius-input");
  const careSelect     = document.querySelector(".care-select");
  const facilitySelect = document.querySelector(".facility-select");
  const searchBtn      = document.querySelector(".search-btn");
  const leftArrow      = document.querySelector(".radius-btn.left");
  const rightArrow     = document.querySelector(".radius-btn.right");

  // ---- 1. Radius adjustment ----
  function adjustRadius(delta) {
    const val = parseInt(radiusInput.value || "0", 10);
    const newVal = Math.max(1, Math.min(50, val + delta));
    radiusInput.value = newVal;
  }

  leftArrow?.addEventListener("click", () => adjustRadius(-1));
  rightArrow?.addEventListener("click", () => adjustRadius(1));

  // ---- 2. Geocode helper ----
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

  const toKm = miles => miles * 1.60934;
  function distanceKm(a, b, c, d) {
    const R = 6371,
      dLat = (c - a) * Math.PI / 180,
      dLon = (d - b) * Math.PI / 180,
      u = Math.sin(dLat / 2) ** 2 +
        Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(u));
  }

  // ---- 3. Hook into map.js ----
  // Map + markers created globally in map.js:
  //  -> const map, const markers, const data (facilities)

  if (typeof map === "undefined" || typeof markers === "undefined") {
    console.warn("Map not found — make sure map.js loads before filters.js");
    return;
  }

  // ---- 4. Search button event ----
  searchBtn?.addEventListener("click", async () => {
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
        alert("Location not found.");
        return;
      }
    }

    // Fetch same JSON as map.js
    fetch("data/facilities.json")
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(f => {
          const name = (f.FACILITY_NAME || "").toUpperCase();
          const type = (f.TYPE || "").toUpperCase();
          const sub = (f.SUBTYPE || "").toUpperCase();

          // Care type filter
          let ok = true;
          if (careVal === "behavioral_health")
            ok = type.includes("BEHAVIORAL HEALTH") || sub.includes("BEHAVIORAL HEALTH");
          else if (careVal === "assisted_living")
            ok = type.includes("ASSISTED LIVING");
          else if (careVal === "memory_care")
            ok = name.includes("MEMORY") || sub.includes("MEMORY");
          if (!ok) return false;

          // Facility size filter
          const cap = parseInt(f.CAPACITY_INT || f.Capacity || 0, 10);
          if (sizeVal === "residential" && cap > 12) return false;
          if (sizeVal === "facility" && cap <= 12) return false;

          // Radius filter
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

  // ---- 5. Replot markers ----
  function updateMarkers(list) {
    markers.clearLayers();

    if (!list.length) {
      alert("No facilities match your filters.");
      return;
    }

    list.forEach(f => {
      const lat = f.N_LAT, lon = f.N_LON;
      if (!lat || !lon) return;

      const marker = L.marker([lat, lon]);
      marker.bindPopup(`
        <strong>${f.FACILITY_NAME || "Unknown Facility"}</strong><br>
        ${f.ADDRESS || ""}<br>
        ${f.CITY || ""}
      `);
      markers.addLayer(marker);
    });

    map.addLayer(markers);
    if (markers.getLayers().length)
      map.fitBounds(markers.getBounds().pad(0.2));
  }
});
