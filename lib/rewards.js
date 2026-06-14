// Loyalty engine: converts good real-world behaviour (efficient driving, clean energy,
// battery-friendly charging, consistency) into points, tiers, streaks, badges and
// redeemable rewards. This is the layer that turns telematics into stickiness.
const C = require('./config');

// Points awarded for a single trip, before tier multiplier.
function tripBasePoints(trip) {
  const distancePts = (trip.distanceKm || 0) * C.POINTS_PER_KM;
  const ecoBonus = ((trip.ecoScore || 0) / 100) * C.POINTS_ECO_BONUS_MAX;
  const co2Bonus = (trip.co2SavedKg || 0) * C.POINTS_PER_KG_CO2;
  const chargeBonus = trip.batteryFriendlyCharge ? C.POINTS_BATTERY_FRIENDLY_CHARGE : 0;
  return Math.round(distancePts + ecoBonus + co2Bonus + chargeBonus);
}

function tierFor(lifetimePoints) {
  let current = C.TIERS[0];
  for (const t of C.TIERS) if (lifetimePoints >= t.min) current = t;
  const idx = C.TIERS.indexOf(current);
  const next = C.TIERS[idx + 1] || null;
  return {
    name: current.name,
    multiplier: current.multiplier,
    color: current.color,
    next: next ? next.name : null,
    pointsToNext: next ? next.min - lifetimePoints : 0,
    progressPct: next
      ? Math.round(((lifetimePoints - current.min) / (next.min - current.min)) * 100)
      : 100,
  };
}

// Recompute streak based on the most recent active dates.
function computeStreak(activeDates) {
  if (!activeDates || !activeDates.length) return 0;
  const days = [...new Set(activeDates.map((d) => d.slice(0, 10)))].sort().reverse();
  let streak = 0;
  let cursor = new Date(days[0] + 'T00:00:00Z');
  // Allow the streak to count if the latest activity was today or yesterday.
  const today = new Date();
  const diff = Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - cursor.getTime()) / 86400000);
  if (diff > 1) return 0;
  for (const d of days) {
    const day = new Date(d + 'T00:00:00Z');
    if (day.getTime() === cursor.getTime()) {
      streak++;
      cursor = new Date(cursor.getTime() - 86400000);
    } else {
      break;
    }
  }
  return streak;
}

// Badge catalogue. Each badge has a predicate over the driver's aggregate stats.
const BADGES = [
  { id: 'first-drive', name: 'First Spark', icon: '⚡', desc: 'Logged your first electric trip', test: (s) => s.tripCount >= 1 },
  { id: 'eco-ace', name: 'Eco Ace', icon: '🌿', desc: 'Averaged an A grade across 10+ trips', test: (s) => s.tripCount >= 10 && s.avgEco >= 80 },
  { id: 'ton-saver', name: 'Tonne Saver', icon: '🌍', desc: 'Avoided 1,000 kg of CO₂', test: (s) => s.totalCo2 >= 1000 },
  { id: 'streak-7', name: 'Week Warrior', icon: '🔥', desc: '7-day driving streak', test: (s) => s.streak >= 7 },
  { id: 'streak-30', name: 'Habit Master', icon: '🏆', desc: '30-day driving streak', test: (s) => s.streak >= 30 },
  { id: 'battery-guardian', name: 'Battery Guardian', icon: '🛡️', desc: 'Battery care score above 90', test: (s) => s.careScore >= 90 },
  { id: 'road-tripper', name: 'Road Tripper', icon: '🛣️', desc: 'Driven 5,000 electric km', test: (s) => s.totalDistance >= 5000 },
  { id: 'forest-maker', name: 'Forest Maker', icon: '🌳', desc: 'Offset equal to 100 trees/year', test: (s) => s.totalCo2 / C.CO2_PER_TREE_YEAR >= 100 },
];

function earnedBadges(stats) {
  return BADGES.map((b) => ({ ...b, earned: !!b.test(stats), test: undefined }));
}

// Rolling, achievable challenges keep people coming back. Progress is computed live
// against the driver's recent stats.
function challenges(stats) {
  return [
    {
      id: 'eco-week',
      title: 'Smooth Operator',
      desc: 'Average an 85+ eco score across your trips this week',
      reward: 200,
      progress: clampPct(stats.weekAvgEco, 85),
      metric: `${Math.round(stats.weekAvgEco)} / 85 avg score`,
    },
    {
      id: 'co2-100',
      title: 'Climate Champion',
      desc: 'Save 100 kg of CO₂ this week',
      reward: 250,
      progress: clampPct(stats.weekCo2, 100),
      metric: `${Math.round(stats.weekCo2)} / 100 kg CO₂`,
    },
    {
      id: 'streak-5',
      title: 'Keep the Streak',
      desc: 'Drive on 5 different days in a row',
      reward: 150,
      progress: clampPct(stats.streak, 5),
      metric: `${stats.streak} / 5 days`,
    },
    {
      id: 'gentle-charge',
      title: 'Gentle Charger',
      desc: 'Raise your battery care score to 90',
      reward: 180,
      progress: clampPct(stats.careScore, 90),
      metric: `${Math.round(stats.careScore)} / 90 care score`,
    },
  ];
}

// Redeemable rewards catalogue — real-world partner perks that make points worth
// chasing. Low-cost, frequently-attainable rewards (coffee, car wash) drive daily
// engagement; higher tiers (insurance discount) reward long-term loyalty.
const REWARD_CATALOG = [
  { id: 'coffee-voucher', name: 'Coffee Voucher', desc: 'Free coffee at partner cafés', cost: 150, category: 'Lifestyle', icon: '☕' },
  { id: 'car-wash', name: 'Premium Car Wash', desc: 'Complimentary premium car wash', cost: 300, category: 'Service', icon: '🧽' },
  { id: 'charge-session', name: 'Free Charging Session', desc: '1 hour of free ChargEv fast charging', cost: 500, category: 'Charging', icon: '🔌' },
  { id: 'tree-plant', name: 'Plant 5 Trees', desc: '5 trees planted in your name', cost: 800, category: 'Impact', icon: '🌳' },
  { id: 'service-credit', name: '$10 Service Credit', desc: 'Credit toward vehicle maintenance', cost: 1000, category: 'Service', icon: '🔧' },
  { id: 'carbon-offset', name: 'Offset 1 Tonne CO₂', desc: 'Certified carbon offset in your name', cost: 1200, category: 'Impact', icon: '🌍' },
  { id: 'charge-credit-25', name: '$25 Charging Credit', desc: 'Credit on the public charging network', cost: 2000, category: 'Charging', icon: '⚡' },
  { id: 'insurance-discount', name: '5% Insurance Discount', desc: 'Voucher toward your EV insurance renewal', cost: 5000, category: 'Premium', icon: '🛡️' },
];

function clampPct(value, target) {
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}
function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

module.exports = {
  tripBasePoints,
  tierFor,
  computeStreak,
  earnedBadges,
  challenges,
  REWARD_CATALOG,
  BADGES,
};
