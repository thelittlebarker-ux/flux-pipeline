// Eco-driving score: a 0-100 rating of how efficiently and smoothly a trip was driven.
// Smooth, efficient driving is rewarded because it simultaneously saves energy, cuts
// CO2 and is gentler on the battery — the three things DrivEv wants to reinforce.
const C = require('./config');

function tripEcoScore(trip) {
  const { distanceKm, energyUsedKwh, events = {} } = trip;
  if (!distanceKm || distanceKm <= 0) return 0;

  // 1. Efficiency component (0-70). Lower kWh/100km is better. Use the stored
  // full-distance consumption when present so hybrids (whose energyUsedKwh covers
  // only the electric share) are scored on the same efficiency basis as BEVs.
  const consumption = trip.consumptionKwh100 || (energyUsedKwh / distanceKm) * 100;
  const span = C.EFFICIENCY_CEILING_KWH_100 - C.EFFICIENCY_TARGET_KWH_100;
  const effRatio = clamp((C.EFFICIENCY_CEILING_KWH_100 - consumption) / span, 0, 1);
  const efficiency = effRatio * 70;

  // 2. Smoothness component (0-30) minus event penalties.
  let smoothness = 30;
  smoothness -= (events.harshBraking || 0) * C.PENALTY_HARSH_BRAKE;
  smoothness -= (events.harshAccel || 0) * C.PENALTY_HARSH_ACCEL;
  smoothness -= (events.speedingMin || 0) * C.PENALTY_SPEEDING_MIN;
  smoothness -= (events.idleMin || 0) * C.PENALTY_IDLE_MIN;
  smoothness = clamp(smoothness, 0, 30);

  const score = Math.round(clamp(efficiency + smoothness, 0, 100));
  return score;
}

// Human-readable grade + the single highest-impact coaching tip for the trip.
function tripFeedback(trip) {
  const score = trip.ecoScore ?? tripEcoScore(trip);
  const e = trip.events || {};
  const tips = [];
  if ((e.harshAccel || 0) >= 2) tips.push('Ease off the accelerator — gentle starts save range.');
  if ((e.harshBraking || 0) >= 2) tips.push('Anticipate stops to maximise regen braking.');
  if ((e.speedingMin || 0) >= 3) tips.push('Holding 100–110 km/h dramatically cuts consumption.');
  if ((e.idleMin || 0) >= 5) tips.push('Reduce idling with climate on to preserve charge.');
  if (!tips.length) tips.push('Excellent, efficient drive — keep it up!');
  return { score, grade: grade(score), tip: tips[0], allTips: tips };
}

function grade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

module.exports = { tripEcoScore, tripFeedback, grade };
