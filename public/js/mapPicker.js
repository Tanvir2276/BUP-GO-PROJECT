/**
 * BUPGO - Interactive Map Location Picker (Leaflet + OpenStreetMap)
 * Allows passengers & drivers to pick any location / pickup point visually on the map.
 */

// Major Bangladesh Landmark Coordinates
const BD_MAP_HUBS = [
  { name: 'BUP Campus (Main Gate)', lat: 23.8378, lng: 90.3582 },
  { name: 'ECB Chattar (Matikata)', lat: 23.8242, lng: 90.3854 },
  { name: 'Mirpur 10 Circle', lat: 23.8069, lng: 90.3687 },
  { name: 'Mirpur 1 (Golchottor)', lat: 23.7956, lng: 90.3537 },
  { name: 'Uttara Sector 7', lat: 23.8738, lng: 90.3965 },
  { name: 'Airport Station', lat: 23.8516, lng: 90.4077 },
  { name: 'Banani Kakoli Mor', lat: 23.7937, lng: 90.4043 },
  { name: 'Gulshan 2 Circle', lat: 23.7925, lng: 90.4167 },
  { name: 'Mohakhali Terminal', lat: 23.7776, lng: 90.4054 },
  { name: 'Farmgate Metro', lat: 23.7570, lng: 90.3890 },
  { name: 'Dhanmondi 27 (Rapa)', lat: 23.7530, lng: 90.3768 },
  { name: 'Dhaka University (TSC)', lat: 23.7317, lng: 90.3960 },
  { name: 'Savar Cantonment', lat: 23.9167, lng: 90.2667 },
  { name: 'Chittagong GEC', lat: 22.3569, lng: 91.8215 },
  { name: 'Sylhet Zindabazar', lat: 24.8949, lng: 91.8687 },
  { name: 'Rajshahi Zero Point', lat: 24.3636, lng: 88.6241 },
  { name: 'Khulna Shibbari', lat: 22.8228, lng: 89.5539 },
  { name: 'Barishal Nathullabad', lat: 22.7126, lng: 90.3544 }
];

let mapLeafletInstance = null;
let mapCurrentMarker = null;
let mapSelectedLocationName = 'BUP Campus (Main Gate)';
let mapTargetInput = null;
let mapModalElement = null;

/**
 * Ensures Leaflet library is loaded dynamically
 */
function ensureLeafletLoaded(callback) {
  if (window.L) {
    callback();
    return;
  }

  // Load CSS
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);

  // Load JS
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => {
    callback();
  };
  document.head.appendChild(script);
}

/**
 * Open the Map Picker Modal
 */
function openMapPicker(inputOrId) {
  const inputEl = typeof inputOrId === 'string' ? document.getElementById(inputOrId) : inputOrId;
  if (!inputEl) return;

  mapTargetInput = inputEl;
  mapSelectedLocationName = inputEl.value.trim() || 'BUP Campus (Main Gate)';

  ensureLeafletLoaded(() => {
    renderMapPickerModal();
  });
}

function renderMapPickerModal() {
  if (mapModalElement) {
    mapModalElement.remove();
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'bupgo-map-modal-backdrop';
  backdrop.id = 'bupgo-map-modal';

  backdrop.innerHTML = `
    <div class="bupgo-map-modal-card" onclick="event.stopPropagation()">
      <div class="map-modal-header">
        <div>
          <h4>🗺️ Pick Location on Interactive Map</h4>
          <p>Click anywhere on the map or drag the pin to choose your exact pickup point</p>
        </div>
        <button class="map-modal-close-btn" onclick="closeMapPicker()">&times;</button>
      </div>

      <!-- Quick Regional Hubs -->
      <div class="map-hotspots-bar">
        <span class="map-hotspots-label">Quick Jump:</span>
        ${BD_MAP_HUBS.slice(0, 10).map(hub => `
          <button type="button" class="map-jump-pill" onclick="jumpMapTo(${hub.lat}, ${hub.lng}, '${hub.name}')">
            📍 ${hub.name}
          </button>
        `).join('')}
      </div>

      <!-- Map Viewport -->
      <div class="map-canvas-wrapper">
        <div class="map-crosshair-hint">Tap on map to place pin 📍</div>
        <div id="bupgo-interactive-leaflet-map"></div>
      </div>

      <!-- Footer Action -->
      <div class="map-modal-footer">
        <div class="map-selected-info">
          <span class="map-selected-label">Selected Location:</span>
          <span class="map-selected-name" id="map-picked-text">${mapSelectedLocationName}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="closeMapPicker()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="confirmMapSelection()">Confirm Location</button>
        </div>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', closeMapPicker);
  document.body.appendChild(backdrop);
  mapModalElement = backdrop;

  // Initialize Leaflet Map
  setTimeout(() => {
    initLeafletMapInstance();
  }, 100);
}

function initLeafletMapInstance() {
  const mapContainer = document.getElementById('bupgo-interactive-leaflet-map');
  if (!mapContainer || !window.L) return;

  // Find if current location matches any known hub
  const matchedHub = BD_MAP_HUBS.find(h => mapSelectedLocationName.toLowerCase().includes(h.name.toLowerCase())) || BD_MAP_HUBS[0];
  const startLat = matchedHub.lat;
  const startLng = matchedHub.lng;

  mapLeafletInstance = L.map('bupgo-interactive-leaflet-map', {
    center: [startLat, startLng],
    zoom: 14,
    zoomControl: true
  });

  // Free OpenStreetMap Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapLeafletInstance);

  // Add initial draggable pin
  mapCurrentMarker = L.marker([startLat, startLng], {
    draggable: true
  }).addTo(mapLeafletInstance);

  mapCurrentMarker.bindPopup(`<b>${mapSelectedLocationName}</b>`).openPopup();

  // Handle marker drag
  mapCurrentMarker.on('dragend', (e) => {
    const pos = e.target.getLatLng();
    updatePickedLocation(pos.lat, pos.lng);
  });

  // Handle click on map to move marker
  mapLeafletInstance.on('click', (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    mapCurrentMarker.setLatLng([lat, lng]);
    updatePickedLocation(lat, lng);
  });

  // Invalidate size after modal render
  mapLeafletInstance.invalidateSize();
}

function jumpMapTo(lat, lng, name) {
  if (mapLeafletInstance && mapCurrentMarker) {
    mapLeafletInstance.flyTo([lat, lng], 15);
    mapCurrentMarker.setLatLng([lat, lng]);
    mapCurrentMarker.bindPopup(`<b>${name}</b>`).openPopup();
    mapSelectedLocationName = name;
    const labelEl = document.getElementById('map-picked-text');
    if (labelEl) labelEl.textContent = name;
  }
}

/**
 * Calculates nearest landmark from coordinates or falls back to coordinates
 */
function updatePickedLocation(lat, lng) {
  let nearest = null;
  let minDistance = Infinity;

  BD_MAP_HUBS.forEach(hub => {
    const d = Math.sqrt(Math.pow(hub.lat - lat, 2) + Math.pow(hub.lng - lng, 2));
    if (d < minDistance) {
      minDistance = d;
      nearest = hub;
    }
  });

  // If within ~1.5km of a known hub, use landmark name with offset hint
  if (nearest && minDistance < 0.015) {
    mapSelectedLocationName = nearest.name;
  } else {
    mapSelectedLocationName = `Location Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }

  const labelEl = document.getElementById('map-picked-text');
  if (labelEl) labelEl.textContent = mapSelectedLocationName;

  if (mapCurrentMarker) {
    mapCurrentMarker.bindPopup(`<b>${mapSelectedLocationName}</b>`).openPopup();
  }
}

function confirmMapSelection() {
  if (mapTargetInput && mapSelectedLocationName) {
    mapTargetInput.value = mapSelectedLocationName;
    mapTargetInput.dispatchEvent(new Event('change', { bubbles: true }));
    mapTargetInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  closeMapPicker();
}

function closeMapPicker() {
  if (mapModalElement) {
    mapModalElement.remove();
    mapModalElement = null;
  }
  if (mapLeafletInstance) {
    mapLeafletInstance.remove();
    mapLeafletInstance = null;
  }
}

/**
 * Auto-injects "📍 Pick on Map" trigger button beneath or inside location inputs
 */
function initMapPickerButtons() {
  const targetInputs = [
    { id: 'search-start', label: 'Pick Pickup on Map' },
    { id: 'search-dest', label: 'Pick Destination on Map' },
    { id: 'filter-start', label: 'Map Pick' },
    { id: 'filter-dest', label: 'Map Pick' },
    { id: 'offer-start', label: '📍 Choose Starting Point on Map' },
    { id: 'offer-dest', label: '📍 Choose Destination on Map' },
    { id: 'modal-pickup-location', label: '📍 Choose Exact Pickup Point on Map' }
  ];

  targetInputs.forEach(t => {
    const el = document.getElementById(t.id);
    if (el && !el.dataset.hasMapButton) {
      el.dataset.hasMapButton = 'true';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-pick-map';
      btn.innerHTML = `<span>🗺️</span> <span>${t.label}</span>`;
      btn.onclick = (e) => {
        e.preventDefault();
        openMapPicker(el);
      };

      // Insert immediately after input
      if (el.parentNode) {
        el.parentNode.insertBefore(btn, el.nextSibling);
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMapPickerButtons();
});

// =========================================================
// LIVE GPS ROUTE TRACKER & MULTI-VEHICLE COMPARISON SYSTEM
// (Requirements 9 & 11 - Pathao / Uber / InDrive Style)
// =========================================================
let liveTrackerModal = null;
let liveTrackerMap = null;
let liveDriverMarker = null;
let liveAnimationInterval = null;

function findLocationCoordinates(locName) {
  if (!locName) return { lat: 23.8378, lng: 90.3582 }; // BUP Main Gate
  const lower = locName.toLowerCase();
  const matched = BD_MAP_HUBS.find(h => lower.includes(h.name.toLowerCase()) || h.name.toLowerCase().includes(lower));
  if (matched) return { lat: matched.lat, lng: matched.lng };

  // Fallbacks for key hotspots
  if (lower.includes('mirpur')) return { lat: 23.8069, lng: 90.3687 };
  if (lower.includes('ecb') || lower.includes('matikata')) return { lat: 23.8242, lng: 90.3854 };
  if (lower.includes('uttara') || lower.includes('airport')) return { lat: 23.8738, lng: 90.3965 };
  if (lower.includes('dhanmondi') || lower.includes('farmgate')) return { lat: 23.7530, lng: 90.3768 };
  return { lat: 23.8150, lng: 90.3650 };
}

function openLiveRideTracker(params = {}) {
  const startLoc = params.startLoc || 'Mirpur 10 Circle';
  const destLoc = params.destLoc || 'BUP Campus (Main Gate)';
  const driverName = params.driverName || 'Verified BUP Driver';
  const driverAvatar = params.driverAvatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80';
  const vehicleType = params.vehicleType || 'Car';
  const vehicleModel = params.vehicleModel || 'Toyota Corolla';
  const fare = Number(params.fare || 50);

  ensureLeafletLoaded(() => {
    renderLiveTrackerModal({
      startLoc,
      destLoc,
      driverName,
      driverAvatar,
      vehicleType,
      vehicleModel,
      fare
    });
  });
}

function renderLiveTrackerModal(info) {
  if (liveTrackerModal) {
    closeLiveRideTracker();
  }

  const startCoords = findLocationCoordinates(info.startLoc);
  const destCoords = findLocationCoordinates(info.destLoc);
  
  // Approximate route distance
  const dLat = (destCoords.lat - startCoords.lat) * 111;
  const dLng = (destCoords.lng - startCoords.lng) * 85;
  const distKm = Math.max(1.5, Number(Math.sqrt(dLat * dLat + dLng * dLng).toFixed(1)));
  
  // Dynamic multi-vehicle pricing
  const bikePrice = Math.round(20 + distKm * 12);
  const carPrice = Math.round(50 + distKm * 20);
  const cngPrice = Math.round(40 + distKm * 14);

  const backdrop = document.createElement('div');
  backdrop.className = 'bupgo-map-modal-backdrop';
  backdrop.id = 'bupgo-live-tracker-modal';

  backdrop.innerHTML = `
    <div class="bupgo-map-modal-card" style="max-width: 780px; height: 90vh; max-height: 720px;" onclick="event.stopPropagation()">
      <div class="map-modal-header" style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%);">
        <div>
          <h4>📍 Live GPS Route & Driver Tracker</h4>
          <p>Real-time vehicle position & multi-vehicle fare comparison (Uber / Pathao style)</p>
        </div>
        <button class="map-modal-close-btn" onclick="closeLiveRideTracker()">&times;</button>
      </div>

      <!-- Map Canvas with Floating Driver Overlay -->
      <div class="map-canvas-wrapper" style="position: relative; flex: 1;">
        <!-- Floating Driver Live HUD -->
        <div class="tracker-driver-overlay">
          <div class="tracker-driver-col">
            <img src="${info.driverAvatar}" alt="${info.driverName}" class="tracker-driver-avatar">
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">${info.driverName}</div>
              <div style="font-size: 0.76rem; color: var(--text-muted);">${info.vehicleModel} • ⭐ 4.95 (Top Rated)</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="tracker-eta-pill">
              <span>🚗 Driver is ~4 mins away (${distKm} km)</span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="alert('📞 Connecting secure call to ${info.driverName} (01711-223344)...')" style="padding: 6px 12px; font-size: 0.78rem;">
              📞 Call
            </button>
          </div>
        </div>

        <div id="bupgo-live-tracker-map" style="width: 100%; height: 100%;"></div>
      </div>

      <!-- Multi-Vehicle Fare Comparison Bar (Requirement 11) -->
      <div class="tracker-vehicle-comparison-box">
        <div class="tracker-vehicle-title">
          <span>⚡ Multi-Vehicle Trip Comparison (${distKm} km to Destination)</span>
          <span style="color: var(--bup-primary); font-weight: 700;">Includes 10% Platform Guarantee</span>
        </div>
        <div class="multi-vehicle-cards">
          <!-- Bike -->
          <div class="multi-veh-item ${info.vehicleType.toLowerCase().includes('bike') ? 'selected' : ''}" onclick="selectVehicleInTracker('Bike', ${bikePrice})">
            <div style="font-size: 1.5rem;">🏍️</div>
            <div class="multi-veh-name">Motorbike</div>
            <div class="multi-veh-fare">৳ ${bikePrice}</div>
            <div class="multi-veh-desc">৳20 Base • Fastest</div>
          </div>

          <!-- Car -->
          <div class="multi-veh-item ${info.vehicleType.toLowerCase().includes('car') ? 'selected' : ''}" onclick="selectVehicleInTracker('Car', ${carPrice})">
            <div style="font-size: 1.5rem;">🚗</div>
            <div class="multi-veh-name">Personal Car</div>
            <div class="multi-veh-fare">৳ ${carPrice}</div>
            <div class="multi-veh-desc">৳50 Base • AC Comfort</div>
          </div>

          <!-- CNG -->
          <div class="multi-veh-item ${info.vehicleType.toLowerCase().includes('cng') ? 'selected' : ''}" onclick="selectVehicleInTracker('CNG', ${cngPrice})">
            <div style="font-size: 1.5rem;">🛺</div>
            <div class="multi-veh-name">CNG / Auto</div>
            <div class="multi-veh-fare">৳ ${cngPrice}</div>
            <div class="multi-veh-desc">৳40 Base • Group Shared</div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="map-modal-footer" style="padding: 10px 18px;">
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          <span>Route: <strong>${info.startLoc}</strong> ➔ <strong>${info.destLoc}</strong></span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="alert('🚨 Campus SOS: BUP Proctorial & Security Office notified with your live coordinates.')" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);">
            🚨 Emergency SOS
          </button>
          <button class="btn btn-primary btn-sm" onclick="closeLiveRideTracker()">
            Close Map
          </button>
        </div>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', closeLiveRideTracker);
  document.body.appendChild(backdrop);
  liveTrackerModal = backdrop;

  setTimeout(() => {
    initLiveTrackerLeaflet(startCoords, destCoords, info);
  }, 120);
}

function selectVehicleInTracker(vehType, price) {
  document.querySelectorAll('.multi-veh-item').forEach(el => el.classList.remove('selected'));
  if (event && event.currentTarget) event.currentTarget.classList.add('selected');
}

function initLiveTrackerLeaflet(startCoords, destCoords, info) {
  const container = document.getElementById('bupgo-live-tracker-map');
  if (!container || !window.L) return;

  const centerLat = (startCoords.lat + destCoords.lat) / 2;
  const centerLng = (startCoords.lng + destCoords.lng) / 2;

  liveTrackerMap = L.map('bupgo-live-tracker-map', {
    center: [centerLat, centerLng],
    zoom: 13,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(liveTrackerMap);

  // Generate intermediate path points for realistic curving route
  const points = [];
  const numSteps = 20;
  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    // Add slight natural curve offset
    const curveOffset = Math.sin(t * Math.PI) * 0.003;
    const pLat = startCoords.lat + (destCoords.lat - startCoords.lat) * t + curveOffset;
    const pLng = startCoords.lng + (destCoords.lng - startCoords.lng) * t - curveOffset;
    points.push([pLat, pLng]);
  }

  // Draw Route Polyline
  const polyline = L.polyline(points, {
    color: '#10b981',
    weight: 5,
    opacity: 0.85,
    dashArray: '8, 8'
  }).addTo(liveTrackerMap);

  // Start Marker (Pickup)
  const startMarker = L.marker([startCoords.lat, startCoords.lng]).addTo(liveTrackerMap);
  startMarker.bindPopup(`<b>🟢 Pickup Point</b><br>${info.startLoc}`).openPopup();

  // Destination Marker
  const destMarker = L.marker([destCoords.lat, destCoords.lng]).addTo(liveTrackerMap);
  destMarker.bindPopup(`<b>🏁 Destination</b><br>${info.destLoc}`);

  // Moving Driver Marker
  let currentStep = 3;
  const vehIcon = L.divIcon({
    className: 'live-driver-custom-icon',
    html: `<div style="font-size: 2rem; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4)); animation: pulseEta 1.5s infinite;">🚗</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  liveDriverMarker = L.marker(points[currentStep], { icon: vehIcon }).addTo(liveTrackerMap);
  liveDriverMarker.bindPopup(`<b>${info.driverName}</b><br>Speed: 36 km/h • En route to pickup`);

  // Animate driver moving smoothly along the route
  liveAnimationInterval = setInterval(() => {
    currentStep = (currentStep + 1) % points.length;
    if (liveDriverMarker) {
      liveDriverMarker.setLatLng(points[currentStep]);
    }
  }, 2200);

  liveTrackerMap.fitBounds(polyline.getBounds(), { padding: [60, 60] });
  liveTrackerMap.invalidateSize();
}

function closeLiveRideTracker() {
  if (liveAnimationInterval) {
    clearInterval(liveAnimationInterval);
    liveAnimationInterval = null;
  }
  if (liveTrackerMap) {
    liveTrackerMap.remove();
    liveTrackerMap = null;
  }
  if (liveTrackerModal) {
    liveTrackerModal.remove();
    liveTrackerModal = null;
  }
}
