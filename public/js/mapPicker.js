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
