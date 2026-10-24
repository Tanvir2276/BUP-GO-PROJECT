/**
 * BUPGO - Authoritative Dynamic Ride Fare Calculation & Directions Service
 * Formula: Total Fare = Base Fare + (Distance × Per-KM Rate) + (Chargeable Waiting Minutes × Waiting Rate)
 * Where Chargeable Waiting Minutes = Math.max(0, waitingMinutes - freeWaitingMinutes)
 */

const { FareConfigs } = require('../database/db');

// Known landmark coordinates for accurate Dhaka / Bangladesh routing
const LANDMARKS = {
  'bup': [23.8398, 90.3585],
  'mirpur cantonment': [23.8398, 90.3585],
  'mirpur 10': [23.8069, 90.3687],
  'mirpur 12': [23.8282, 90.3644],
  'mirpur 11': [23.8188, 90.3667],
  'mirpur 1': [23.7956, 90.3537],
  'mirpur 2': [23.8015, 90.3601],
  'mirpur 14': [23.7995, 90.3842],
  'mirpur 6': [23.8090, 90.3610],
  'mirpur dohs': [23.8320, 90.3650],
  'ecb': [23.8239, 90.3924],
  'ecb chattar': [23.8239, 90.3924],
  'matikata': [23.8260, 90.3900],
  'uttara': [23.8748, 90.3976],
  'uttara sector 7': [23.8748, 90.3976],
  'uttara sector 3': [23.8680, 90.3980],
  'uttara sector 10': [23.8820, 90.3880],
  'house building': [23.8748, 90.3976],
  'airport': [23.8510, 90.4070],
  'jasimuddin': [23.8620, 90.4010],
  'dhanmondi': [23.7540, 90.3760],
  'dhanmondi 27': [23.7540, 90.3760],
  'dhanmondi 32': [23.7510, 90.3780],
  'farmgate': [23.7570, 90.3880],
  'khamarbari': [23.7590, 90.3830],
  'agargaon': [23.7780, 90.3740],
  'kazipara': [23.7970, 90.3720],
  'shewrapara': [23.7880, 90.3730],
  'mohakhali': [23.7780, 90.4040],
  'banani': [23.7937, 90.4043],
  'gulshan': [23.7925, 90.4167],
  'kuril': [23.8152, 90.4255],
  'jamuna future park': [23.8135, 90.4242],
  'bashundhara': [23.8150, 90.4290],
  'savar': [23.8580, 90.2600],
  'savar cantonment': [23.9100, 90.2700],
  'nabinagar': [23.9100, 90.2500],
  'hemayetpur': [23.7950, 90.2750],
  'gazipur': [23.9999, 90.4200],
  'tongi': [23.8950, 90.4010]
};

// Default fallback rates as per BUPGO specification
const DEFAULT_RATES = {
  'Bike': {
    vehicleType: 'Bike',
    vehicleDisplayName: 'Motorbike',
    baseFare: 20,
    perKmRate: 12,
    waitingChargePerMin: 0.5,
    freeWaitingMinutes: 3,
    city: 'nationwide'
  },
  'Car': {
    vehicleType: 'Car',
    vehicleDisplayName: 'Personal Car',
    baseFare: 50,
    perKmRate: 20,
    waitingChargePerMin: 1.5,
    freeWaitingMinutes: 3,
    city: 'nationwide'
  },
  'CNG': {
    vehicleType: 'CNG',
    vehicleDisplayName: 'CNG / Auto Rickshaw',
    baseFare: 40,
    perKmRate: 14,
    waitingChargePerMin: 1.0,
    freeWaitingMinutes: 3,
    city: 'nationwide'
  }
};

/**
 * Normalize vehicle type name to standard 'Bike' | 'Car' | 'CNG'
 */
function normalizeVehicleType(type) {
  if (!type) return 'Car';
  const str = String(type).trim().toLowerCase();
  if (str.includes('bike') || str.includes('motor') || str.includes('yamaha') || str.includes('honda cb') || str.includes('gixxer')) {
    return 'Bike';
  }
  if (str.includes('cng') || str.includes('auto') || str.includes('rickshaw')) {
    return 'CNG';
  }
  return 'Car';
}

/**
 * Get coordinates for a given location name
 */
function findCoordinates(locName) {
  if (!locName) return null;
  const lower = locName.toLowerCase();
  for (const [key, coords] of Object.entries(LANDMARKS)) {
    if (lower.includes(key)) {
      return coords;
    }
  }
  return null;
}

/**
 * Haversine formula for distance between two points in km
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance between two locations
 * First checks Directions API if configured; otherwise uses coordinates matrix
 */
async function estimateRouteDistanceKm(startLoc, destLoc) {
  if (!startLoc || !destLoc) return 5.0;

  const sCoord = findCoordinates(startLoc) || LANDMARKS['mirpur 10'];
  const dCoord = findCoordinates(destLoc) || LANDMARKS['bup'];

  // 1. Try actual Directions API if URL is set in environment (e.g. OSRM or Google Maps)
  const directionsApiBase = process.env.DIRECTIONS_API_URL;
  if (directionsApiBase) {
    try {
      const url = `${directionsApiBase.replace(/\/$/, '')}/${sCoord[1]},${sCoord[0]};${dCoord[1]},${dCoord[0]}?overview=false`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        if (json.routes && json.routes[0] && json.routes[0].distance) {
          const km = json.routes[0].distance / 1000;
          return Number(Math.max(1.0, km).toFixed(1));
        }
      }
    } catch (err) {
      // Fallback silently to geodesic route calculator
    }
  }

  // 2. Geodesic calculation with realistic Dhaka road winding factor (1.28x)
  const directKm = haversineDistance(sCoord[0], sCoord[1], dCoord[0], dCoord[1]);
  if (directKm < 0.5) {
    return 1.8; // Minimum local route inside Mirpur Cantonment / DOHS
  }
  const roadKm = directKm * 1.28;
  return Number(Math.max(1.0, roadKm).toFixed(1));
}

/**
 * Fetch authoritative fare config from MongoDB / NoSQL store
 */
async function getFareConfig(vehicleType, city = 'nationwide') {
  const normType = normalizeVehicleType(vehicleType);

  try {
    // 1. Try city-specific config first
    if (city && city !== 'nationwide') {
      const cityConfig = await FareConfigs.findOne({ vehicleType: normType, city: city, isActive: true });
      if (cityConfig) return cityConfig;
    }

    // 2. Nationwide default config
    const nationwideConfig = await FareConfigs.findOne({ vehicleType: normType, city: 'nationwide', isActive: true });
    if (nationwideConfig) return nationwideConfig;

    // 3. Any active config matching vehicle
    const anyConfig = await FareConfigs.findOne({ vehicleType: normType, isActive: true });
    if (anyConfig) return anyConfig;
  } catch (err) {
    console.warn('Fare config lookup notice:', err.message);
  }

  // Fallback to specification default rates
  return DEFAULT_RATES[normType] || DEFAULT_RATES['Car'];
}

/**
 * Authoritative Fare Calculator
 * Total Fare = Base Fare + (Distance × Per-KM Rate) + (Chargeable Waiting Minutes × Waiting Rate)
 * Where Chargeable Waiting Minutes = Math.max(0, waitingMinutes - freeWaitingMinutes)
 */
async function calculateAuthoritativeFare({
  vehicleType,
  startingLocation,
  destination,
  distanceKm,
  waitingMinutes = 0,
  city = 'nationwide'
}) {
  const normVehicle = normalizeVehicleType(vehicleType);
  const config = await getFareConfig(normVehicle, city);

  let finalDistanceKm = Number(distanceKm);
  if (!finalDistanceKm || isNaN(finalDistanceKm) || finalDistanceKm <= 0) {
    finalDistanceKm = await estimateRouteDistanceKm(startingLocation, destination);
  } else {
    finalDistanceKm = Number(finalDistanceKm.toFixed(1));
  }

  const waitMins = Math.max(0, Number(waitingMinutes) || 0);
  const freeWaitMins = Math.max(0, Number(config.freeWaitingMinutes) || 3);
  const chargeableWaitMins = Math.max(0, waitMins - freeWaitMins);

  const baseFare = Number(config.baseFare) || 0;
  const perKmRate = Number(config.perKmRate) || 0;
  const waitingChargePerMin = Number(config.waitingChargePerMin) || 0;

  const distanceCost = Number((finalDistanceKm * perKmRate).toFixed(2));
  const waitingCost = Number((chargeableWaitMins * waitingChargePerMin).toFixed(2));
  const totalFare = Math.max(baseFare, Math.round(baseFare + distanceCost + waitingCost));

  const snapshot = {
    vehicleType: normVehicle,
    vehicleDisplayName: config.vehicleDisplayName || normVehicle,
    city: config.city || 'nationwide',
    distanceKm: finalDistanceKm,
    waitingMinutes: waitMins,
    freeWaitingMinutes: freeWaitMins,
    chargeableWaitingMinutes: chargeableWaitMins,
    rates: {
      baseFare: baseFare,
      perKmRate: perKmRate,
      waitingChargePerMin: waitingChargePerMin
    },
    breakdown: {
      baseFareFormatted: `৳${baseFare}`,
      distanceCostFormatted: `৳${distanceCost}`,
      waitingCostFormatted: `৳${waitingCost}`,
      formula: `৳${baseFare} (Base) + (${finalDistanceKm} km × ৳${perKmRate}) + (${chargeableWaitMins} min chargeable × ৳${waitingChargePerMin})`
    },
    totalFare: totalFare,
    currency: '৳',
    calculatedAt: new Date().toISOString()
  };

  return snapshot;
}

module.exports = {
  normalizeVehicleType,
  estimateRouteDistanceKm,
  getFareConfig,
  calculateAuthoritativeFare,
  DEFAULT_RATES
};
