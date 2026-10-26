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
  const distKm = Math.max(3.2, Number(Math.sqrt(dLat * dLat + dLng * dLng).toFixed(1)));
  
  // Realistic Dhaka / Pathao Market Pricing (Image 1 calibration)
  const bikePrice = Math.max(75, Math.round(35 + distKm * 18));
  const cngPrice = Math.max(120, Math.round(60 + distKm * 21));
  const plusCarPrice = Math.max(260, Math.round(150 + distKm * 52));
  const primeCarPrice = Math.max(380, Math.round(220 + distKm * 68));

  const pickupEtaMins = 8;
  const travelDurationMins = Math.max(20, Math.round(distKm * 2.8 + 8));

  const backdrop = document.createElement('div');
  backdrop.className = 'bupgo-map-modal-backdrop';
  backdrop.id = 'bupgo-live-tracker-modal';

  backdrop.innerHTML = `
    <div class="bupgo-map-modal-card" style="max-width: 820px; height: 92vh; max-height: 780px;" onclick="event.stopPropagation()">
      <div class="map-modal-header" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
        <div>
          <h4>🗺️ Pathao Live GPS Navigation & Traffic Heatmap</h4>
          <p>Real-time road congestion, shortest path & live vehicle tracking (Pathao UI)</p>
        </div>
        <button class="map-modal-close-btn" onclick="closeLiveRideTracker()">&times;</button>
      </div>

      <!-- Map Canvas with Floating HUD & Traffic Legend -->
      <div class="map-canvas-wrapper" style="position: relative; flex: 1; min-height: 280px;">
        <div id="bupgo-live-tracker-map" style="width: 100%; height: 100%;"></div>

        <!-- Live Traffic Indicator Widget (Image 1) -->
        <div class="pathao-traffic-legend">
          <span>🚦 Route Traffic:</span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <span class="traffic-dot" style="background: #10b981;"></span> Free
          </span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <span class="traffic-dot" style="background: #f59e0b;"></span> Moderate
          </span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <span class="traffic-dot" style="background: #ef4444;"></span> Congested
          </span>
        </div>
      </div>

      <!-- Pathao Ride Details Sheet (Image 1 Exact Layout) -->
      <div class="pathao-ride-sheet">
        <div class="pathao-sheet-header">
          <div>
            <div class="pathao-sheet-title">Ride Details</div>
            <div style="font-size: 0.76rem; color: #f59e0b; font-weight: 700; margin-top: 2px;">
              ℹ️ A fee may apply for long distance pickup • 10% BUPGO Platform Guarantee
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.78rem; padding: 4px 10px;">
            📅 Pickup now ▼
          </button>
        </div>

        <!-- Vehicle Rows Matching Image 1 -->
        <div class="pathao-vehicle-list">
          <!-- Bike -->
          <div class="pathao-vehicle-row active" onclick="selectPathaoVehicleRow(this, 'Bike', ${bikePrice})" data-veh="Bike">
            <div class="pathao-veh-left">
              <div class="pathao-veh-icon">🏍️</div>
              <div class="pathao-veh-info">
                <h5>Bike <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">👤 1</span></h5>
                <div class="pathao-veh-eta">${pickupEtaMins} mins away</div>
                <div class="pathao-veh-sub">Quick and affordable ride</div>
              </div>
            </div>
            <div class="pathao-veh-price">
              <div class="pathao-veh-fare-val">৳ ${bikePrice}</div>
            </div>
          </div>

          <!-- CNG -->
          <div class="pathao-vehicle-row" onclick="selectPathaoVehicleRow(this, 'CNG', ${cngPrice})" data-veh="CNG">
            <div class="pathao-veh-left">
              <div class="pathao-veh-icon">🛺</div>
              <div class="pathao-veh-info">
                <h5>CNG <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">👤 3</span></h5>
                <div class="pathao-veh-eta">11 mins away</div>
                <div class="pathao-veh-sub">Your local ride, just around the corner</div>
              </div>
            </div>
            <div class="pathao-veh-price">
              <div class="pathao-veh-fare-val">~৳ ${cngPrice}</div>
              <div style="font-size: 0.68rem; color: #16a34a; font-weight: 700;">💵 Offer your fare</div>
            </div>
          </div>

          <!-- Plus Intercity / Car -->
          <div class="pathao-vehicle-row" onclick="selectPathaoVehicleRow(this, 'Plus Car', ${plusCarPrice})" data-veh="Car">
            <div class="pathao-veh-left">
              <div class="pathao-veh-icon">🚗</div>
              <div class="pathao-veh-info">
                <h5>Plus Intercity <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">👤 4</span></h5>
                <div class="pathao-veh-eta">8 mins away</div>
                <div class="pathao-veh-sub">Affordable cars for your daily commute</div>
              </div>
            </div>
            <div class="pathao-veh-price">
              <div class="pathao-veh-fare-val">৳ ${plusCarPrice}</div>
              <div style="font-size: 0.68rem; color: #16a34a; font-weight: 700;">💵 Offer your fare</div>
            </div>
          </div>

          <!-- Prime Intercity -->
          <div class="pathao-vehicle-row" onclick="selectPathaoVehicleRow(this, 'Prime Car', ${primeCarPrice})" data-veh="Prime">
            <div class="pathao-veh-left">
              <div class="pathao-veh-icon">🚘</div>
              <div class="pathao-veh-info">
                <h5>Prime Intercity <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">👤 4</span></h5>
                <div class="pathao-veh-eta">5 mins away</div>
                <div class="pathao-veh-sub">Premium cars for your comfort</div>
              </div>
            </div>
            <div class="pathao-veh-price">
              <div class="pathao-veh-fare-val">~৳ ${primeCarPrice}</div>
            </div>
          </div>
        </div>

        <!-- Big Red Choose Button (Image 1 Replica) -->
        <button type="button" class="btn-choose-pathao" id="btn-pathao-confirm" onclick="confirmPathaoBooking()">
          Choose Bike — ৳ ${bikePrice}
        </button>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', closeLiveRideTracker);
  document.body.appendChild(backdrop);
  liveTrackerModal = backdrop;

  setTimeout(() => {
    initLiveTrackerLeaflet(startCoords, destCoords, info, distKm, pickupEtaMins, travelDurationMins);
  }, 120);
}

let selectedPathaoVeh = 'Bike';
let selectedPathaoPrice = 274;

function selectPathaoVehicleRow(el, vehName, price) {
  document.querySelectorAll('.pathao-vehicle-row').forEach(r => r.classList.remove('active'));
  if (el) el.classList.add('active');
  selectedPathaoVeh = vehName;
  selectedPathaoPrice = price;

  const btn = document.getElementById('btn-pathao-confirm');
  if (btn) btn.textContent = `Choose ${vehName} — ৳ ${price}`;
}

function confirmPathaoBooking() {
  alert(`🚗 Ride Request Dispatched!\n\nVehicle: ${selectedPathaoVeh}\nEstimated Fare: ৳${selectedPathaoPrice}\nNearby drivers have been notified with high priority!`);
  closeLiveRideTracker();
}

function initLiveTrackerLeaflet(startCoords, destCoords, info, distKm, pickupEta, travelEta) {
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

  // Generate intermediate points along shortest path with natural curvature
  const points = [];
  const numSteps = 24;
  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const curveOffset = Math.sin(t * Math.PI) * 0.0035;
    const pLat = startCoords.lat + (destCoords.lat - startCoords.lat) * t + curveOffset;
    const pLng = startCoords.lng + (destCoords.lng - startCoords.lng) * t - curveOffset;
    points.push([pLat, pLng]);
  }

  // Draw Multi-Colored Live Traffic Congestion Polyline (Image 1)
  const seg1 = points.slice(0, 9);
  const seg2 = points.slice(8, 17);
  const seg3 = points.slice(16, points.length);

  // 1. Green Segment (Free-flowing road)
  L.polyline(seg1, { color: '#10b981', weight: 6, opacity: 0.9 }).addTo(liveTrackerMap);
  // 2. Yellow Segment (Moderate city traffic)
  L.polyline(seg2, { color: '#f59e0b', weight: 6, opacity: 0.9 }).addTo(liveTrackerMap);
  // 3. Red Segment (Heavy congestion near intersections/flyover)
  L.polyline(seg3, { color: '#ef4444', weight: 6, opacity: 0.9 }).addTo(liveTrackerMap);

  // Floating Pickup Card Pin (Image 1: "Pickup in 8 mins")
  const pickupCardIcon = L.divIcon({
    className: 'pathao-pin-icon-wrap',
    html: `
      <div class="pathao-floating-pin-card">
        <span style="font-size: 1.1rem;">📍</span>
        <div>
          <strong>Pickup in ${pickupEta} mins</strong>
          <span class="pin-title">${info.startLoc} &gt;</span>
        </div>
      </div>
    `,
    iconSize: [190, 44],
    iconAnchor: [95, 44]
  });
  L.marker([startCoords.lat, startCoords.lng], { icon: pickupCardIcon }).addTo(liveTrackerMap);

  // Floating Destination Card Pin (Image 1: "Reach in 42 mins")
  const destCardIcon = L.divIcon({
    className: 'pathao-pin-icon-wrap',
    html: `
      <div class="pathao-floating-pin-card" style="border-left: 4px solid #ef4444;">
        <span style="font-size: 1.1rem;">🏁</span>
        <div>
          <strong>Reach in ${travelEta} mins</strong>
          <span class="pin-title">${info.destLoc} &gt;</span>
        </div>
      </div>
    `,
    iconSize: [210, 44],
    iconAnchor: [105, 44]
  });
  L.marker([destCoords.lat, destCoords.lng], { icon: destCardIcon }).addTo(liveTrackerMap);

  // Scatter Nearby Available Drivers on Map (Image 1 replica: multiple vehicle icons)
  const nearbyVehicles = [
    { offsetLat: 0.005, offsetLng: 0.004, icon: '🏍️' },
    { offsetLat: -0.004, offsetLng: 0.006, icon: '🚗' },
    { offsetLat: 0.007, offsetLng: -0.005, icon: '🛺' },
    { offsetLat: -0.006, offsetLng: -0.004, icon: '🏍️' },
    { offsetLat: 0.002, offsetLng: 0.008, icon: '🚗' }
  ];

  nearbyVehicles.forEach(nv => {
    const vIcon = L.divIcon({
      className: 'nearby-driver-pin',
      html: `<div style="font-size: 1.6rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); transform: rotate(${Math.floor(Math.random() * 45)}deg);">
               ${nv.icon}
             </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker([startCoords.lat + nv.offsetLat, startCoords.lng + nv.offsetLng], { icon: vIcon }).addTo(liveTrackerMap);
  });

  // Animated En-Route Driver Marker
  let currentStep = 4;
  const driverIcon = L.divIcon({
    className: 'live-driver-custom-icon',
    html: `<div style="font-size: 2.1rem; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); animation: pulseEta 1.5s infinite;">
             🚗
           </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  liveDriverMarker = L.marker(points[currentStep], { icon: driverIcon }).addTo(liveTrackerMap);
  liveDriverMarker.bindPopup(`<b>${info.driverName}</b><br>Speed: 38 km/h • Shortest path to pickup`).openPopup();

  liveAnimationInterval = setInterval(() => {
    currentStep = (currentStep + 1) % points.length;
    if (liveDriverMarker) {
      liveDriverMarker.setLatLng(points[currentStep]);
    }
  }, 2200);

  const fullBounds = L.latLngBounds([
    [startCoords.lat, startCoords.lng],
    [destCoords.lat, destCoords.lng]
  ]);
  liveTrackerMap.fitBounds(fullBounds, { padding: [60, 60] });
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
