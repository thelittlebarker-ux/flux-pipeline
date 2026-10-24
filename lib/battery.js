// Battery life model. Estimates State of Health (SoH), projects remaining useful life,
// flags warranty status and — most importantly for stickiness — turns the driver's own
// charging habits into concrete, rewardable advice.
const C = require('./config');

// Estimate SoH (%) from accumulated usage + how harsh that usage has been.
// This is a transparent heuristic, not a BMS replacement: cycles drive the bulk of
// degradation, with multipliers for fast-charging, heat and deep discharges.
function estimateSoH(b) {
  const cycles = b.cycleCount || 0;
  // Base linear fade: rated cycles take the pack from 100% -> 80%.
  const baseFade = (cycles / C.BATTERY_RATED_CYCLES) * 20;
  // Stressors accelerate fade.
  const fastChargeStress = (b.fastChargePct || 0) / 100 * 0.4; // up to +40% fade rate
  const heatStress = Math.max(0, (b.avgTempC || 25) - 30) / 100; // hot packs age faster
  const deepDischargeStress = (b.deepDischargePct || 0) / 100 * 0.25;
  const stressMultiplier = 1 + fastChargeStress + heatStress + deepDischargeStress;
  const soh = 100 - baseFade * stressMultiplier;
  return clamp(round(soh, 1), 50, 100);
}

// 0-100 "battery care" score reflecting how kind the driver's habits are to the pack.
function careScore(b) {
  let score = 100;
  score -= Math.max(0, (b.fastChargePct || 0) - 20) * 0.5; // occasional DC fast charging is fine
  score -= Math.max(0, (b.avgTempC || 25) - 30) * 1.2;
  score -= Math.max(0, (b.deepDischargePct || 0) - 10) * 0.6;
  score -= Math.max(0, 80 - (b.avgChargeCeiling || 80)) < 0
    ? (b.avgChargeCeiling - 80) * 0.8 // charging above 80% routinely
    : 0;
  return Math.round(clamp(score, 0, 100));
}

function recommendations(b) {
  const recs = [];
  if ((b.fastChargePct || 0) > 40)
    recs.push({ id: 'fastcharge', text: 'Lean on AC home charging — frequent DC fast-charging speeds up fade.', impact: 'high' });
  if ((b.avgChargeCeiling || 80) > 85)
    recs.push({ id: 'ceiling', text: 'Set a daily charge limit of 80%; reserve 100% for road trips.', impact: 'high' });
  if ((b.deepDischargePct || 0) > 15)
    recs.push({ id: 'discharge', text: 'Plug in before dropping below 20% to avoid deep discharges.', impact: 'medium' });
  if ((b.avgTempC || 25) > 32)
    recs.push({ id: 'heat', text: 'Park in shade / use pre-conditioning — heat is the battery’s enemy.', impact: 'medium' });
  if (!recs.length)
    recs.push({ id: 'great', text: 'Your charging habits are textbook. This pack will go the distance.', impact: 'low' });
  return recs;
}

// Project remaining useful life until the warranty SoH floor, given fade so far.
function projection(vehicle) {
  const b = vehicle.battery || {};
  const soh = b.sohPct ?? estimateSoH(b);
  const ageYears = Math.max(0.1, yearsSince(vehicle.inServiceDate));
  const fadeSoFar = 100 - soh;
  const fadePerYear = fadeSoFar / ageYears || 1;
  const yearsToFloor = (soh - C.WARRANTY_SOH_FLOOR) / fadePerYear;
  return {
    sohPct: round(soh, 1),
    estimatedYearsRemaining: round(Math.max(0, yearsToFloor), 1),
    fadePerYearPct: round(fadePerYear, 2),
    rangeNowKm: Math.round((vehicle.ratedRangeKm || 0) * (soh / 100)),
    rangeNewKm: vehicle.ratedRangeKm || 0,
  };
}

function warrantyStatus(vehicle) {
  const ageYears = yearsSince(vehicle.inServiceDate);
  const soh = vehicle.battery?.sohPct ?? estimateSoH(vehicle.battery || {});
  const withinYears = ageYears <= C.WARRANTY_YEARS;
  const withinKm = (vehicle.odometerKm || 0) <= C.WARRANTY_KM;
  const aboveFloor = soh >= C.WARRANTY_SOH_FLOOR;
  return {
    active: withinYears && withinKm,
    yearsUsed: round(ageYears, 1),
    yearsTotal: C.WARRANTY_YEARS,
    kmUsed: vehicle.odometerKm || 0,
    kmTotal: C.WARRANTY_KM,
    healthyVsFloor: aboveFloor,
    sohFloor: C.WARRANTY_SOH_FLOOR,
  };
}

function fullReport(vehicle) {
  const b = vehicle.battery || {};
  return {
    soh: estimateSoH(b),
    careScore: careScore(b),
    projection: projection(vehicle),
    warranty: warrantyStatus(vehicle),
    recommendations: recommendations(b),
    habits: {
      fastChargePct: b.fastChargePct || 0,
      avgChargeCeiling: b.avgChargeCeiling || 80,
      avgTempC: b.avgTempC || 25,
      cycleCount: b.cycleCount || 0,
      deepDischargePct: b.deepDischargePct || 0,
    },
  };
}

function yearsSince(dateStr) {
  if (!dateStr) return 1;
  const ms = Date.now() - new Date(dateStr).getTime();
  return ms / (365.25 * 24 * 3600 * 1000);
}
function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
function round(n, d = 2) { const f = Math.pow(10, d); return Math.round(n * f) / f; }

module.exports = { estimateSoH, careScore, recommendations, projection, warrantyStatus, fullReport };
