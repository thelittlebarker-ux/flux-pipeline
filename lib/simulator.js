// Telematics simulator. Stands in for a real OBD-II / connected-car feed so the whole
// platform is demoable end-to-end, and powers the "drive a trip" button that lets users
// see points and impact update in real time.
const co2 = require('./co2');
const scoring = require('./scoring');
const rewards = require('./rewards');
const C = require('./config');

const TRIP_PROFILES = [
  { name: 'City commute', distRange: [6, 18], baseConsumption: 16, speedRange: [25, 55] },
  { name: 'Highway run', distRange: [40, 120], baseConsumption: 19, speedRange: [90, 115] },
  { name: 'School run', distRange: [3, 9], baseConsumption: 17, speedRange: [20, 45] },
  { name: 'Weekend trip', distRange: [80, 220], baseConsumption: 18, speedRange: [80, 110] },
  { name: 'Errands', distRange: [4, 14], baseConsumption: 18, speedRange: [25, 50] },
];

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Generate a single trip. `driverSkill` (0..1) biases towards smoother, more efficient
// driving so simulated drivers feel distinct.
function generateTrip(vehicleId, opts = {}) {
  const profile = opts.profile ? TRIP_PROFILES.find((p) => p.name === opts.profile) || pick(TRIP_PROFILES) : pick(TRIP_PROFILES);
  const skill = opts.skill ?? rand(0.4, 0.95);
  const powertrain = opts.powertrain || 'BEV';
  const pt = C.POWERTRAINS[powertrain] || C.POWERTRAINS.BEV;
  const when = opts.when ? new Date(opts.when) : new Date();

  const distanceKm = round(rand(profile.distRange[0], profile.distRange[1]), 1);
  const avgSpeed = round(rand(profile.speedRange[0], profile.speedRange[1]), 0);
  const durationMin = Math.max(1, Math.round((distanceKm / avgSpeed) * 60));

  // Consumption rises with poor skill and high speed. Energy is only drawn for the
  // electric share of the distance (PHEV/HEV burn petrol for the rest).
  const speedPenalty = Math.max(0, avgSpeed - 90) * 0.04;
  const skillPenalty = (1 - skill) * 6;
  const consumption = profile.baseConsumption + speedPenalty + skillPenalty + rand(-1.5, 1.5);
  const energyUsedKwh = round((consumption / 100) * distanceKm * pt.electricShare, 2);
  const regenKwh = round(energyUsedKwh * rand(0.05, 0.22) * skill, 2);

  // Harsh events scale inversely with skill.
  const harsh = (base) => Math.max(0, Math.round(base * (1 - skill) * rand(0, 2.2)));
  const events = {
    harshBraking: harsh(distanceKm / 12),
    harshAccel: harsh(distanceKm / 12),
    speedingMin: avgSpeed > 100 ? round(rand(0, durationMin * 0.4) * (1 - skill), 1) : 0,
    idleMin: round(rand(0, 4) * (1 - skill), 1),
  };

  const trip = {
    id: 'trip_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    vehicleId,
    profile: profile.name,
    startedAt: new Date(when.getTime() - durationMin * 60000).toISOString(),
    endedAt: when.toISOString(),
    distanceKm,
    durationMin,
    avgSpeedKph: avgSpeed,
    maxSpeedKph: Math.round(avgSpeed + rand(8, 30)),
    energyUsedKwh,
    regenKwh,
    consumptionKwh100: round(consumption, 1),
    powertrain,
    electricShare: pt.electricShare,
    events,
    batteryFriendlyCharge: pt.plugIn && Math.random() < 0.5 * skill,
  };

  trip.ecoScore = scoring.tripEcoScore(trip);
  trip.co2SavedKg = co2.tripCo2SavedKg(distanceKm, energyUsedKwh, powertrain);
  trip.pointsEarned = rewards.tripBasePoints(trip);
  return trip;
}

// Build a trip from explicit user-chosen parameters (the interactive Simulator Lab):
// distance + driving aggression + regen level + speed. Lets a driver "log" exactly the
// drive they configured on screen so the persisted trip matches what they previewed.
function tripFromParams(vehicleId, p = {}) {
  const distanceKm = round(clamp(p.distanceKm ?? 20, 1, 600), 1);
  const aggression = clamp(p.aggression ?? 0.4, 0, 1); // 0 = serene, 1 = spirited
  const regen = clamp(p.regen ?? 0.6, 0, 1); // single-pedal / regen strength
  const avgSpeed = round(clamp(p.avgSpeedKph ?? 60, 10, 140), 0);
  const skill = 1 - aggression; // aggression is the inverse of smooth-driving skill
  const powertrain = p.powertrain || 'BEV';
  const ptc = C.POWERTRAINS[powertrain] || C.POWERTRAINS.BEV;
  const when = p.when ? new Date(p.when) : new Date();
  const durationMin = Math.max(1, Math.round((distanceKm / avgSpeed) * 60));

  // Aggression and speed raise consumption; strong regen claws some of it back.
  const base = 16;
  const speedPenalty = Math.max(0, avgSpeed - 90) * 0.05;
  const aggrPenalty = aggression * 7;
  const consumptionRaw = base + speedPenalty + aggrPenalty;
  const regenSaving = aggrPenalty * regen * 0.6; // regen offsets stop-start losses
  const consumption = Math.max(11, consumptionRaw - regenSaving);
  const energyUsedKwh = round((consumption / 100) * distanceKm * ptc.electricShare, 2);
  const regenKwh = round(energyUsedKwh * (0.05 + regen * 0.2), 2);

  const events = {
    harshBraking: Math.max(0, Math.round((distanceKm / 14) * aggression * (1 - regen * 0.7))),
    harshAccel: Math.max(0, Math.round((distanceKm / 12) * aggression)),
    speedingMin: avgSpeed > 100 ? round(durationMin * 0.3 * aggression, 1) : 0,
    idleMin: round(2 * aggression, 1),
  };

  const trip = {
    id: 'trip_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    vehicleId,
    profile: p.profile || 'Custom drive',
    startedAt: new Date(when.getTime() - durationMin * 60000).toISOString(),
    endedAt: when.toISOString(),
    distanceKm,
    durationMin,
    avgSpeedKph: avgSpeed,
    maxSpeedKph: Math.round(avgSpeed + 10 + aggression * 30),
    energyUsedKwh,
    regenKwh,
    consumptionKwh100: round(consumption, 1),
    powertrain,
    electricShare: ptc.electricShare,
    events,
    batteryFriendlyCharge: ptc.plugIn && !!p.batteryFriendlyCharge,
    params: { aggression, regen, avgSpeedKph: avgSpeed },
  };
  trip.ecoScore = scoring.tripEcoScore(trip);
  trip.co2SavedKg = co2.tripCo2SavedKg(distanceKm, energyUsedKwh, powertrain);
  trip.pointsEarned = rewards.tripBasePoints(trip);
  return trip;
}

function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

// Generate a back-dated history of trips spread over `days` for seeding.
function generateHistory(vehicleId, { days = 45, perDay = [0, 3], skill, powertrain } = {}) {
  const trips = [];
  const now = Date.now();
  for (let d = days; d >= 0; d--) {
    const count = randInt(perDay[0], perDay[1]);
    for (let i = 0; i < count; i++) {
      const dayMs = now - d * 86400000;
      const when = new Date(dayMs - randInt(0, 20) * 3600000 - randInt(0, 59) * 60000);
      trips.push(generateTrip(vehicleId, { when, skill, powertrain }));
    }
  }
  return trips.sort((a, b) => new Date(a.endedAt) - new Date(b.endedAt));
}

function round(n, d = 2) { const f = Math.pow(10, d); return Math.round(n * f) / f; }

module.exports = { generateTrip, tripFromParams, generateHistory, TRIP_PROFILES };
