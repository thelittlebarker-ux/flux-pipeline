const express = require('express');
const cors = require('cors');
const path = require('path');

const store = require('./lib/store');
const seedModule = require('./lib/seed');
const simulator = require('./lib/simulator');
const co2 = require('./lib/co2');
const scoring = require('./lib/scoring');
const battery = require('./lib/battery');
const rewards = require('./lib/rewards');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Auto-seed on first boot so a fresh deploy is immediately usable.
function ensureSeeded() {
  if (!store.exists()) store.write(seedModule.seed());
}
ensureSeeded();

// ----- aggregation helpers --------------------------------------------------

function tripsForUser(db, userId) {
  const vehicleIds = db.vehicles.filter((v) => v.userId === userId).map((v) => v.id);
  return db.trips
    .filter((t) => vehicleIds.includes(t.vehicleId))
    .sort((a, b) => new Date(a.endedAt) - new Date(b.endedAt));
}

function withinDays(trips, days) {
  const cutoff = Date.now() - days * 86400000;
  return trips.filter((t) => new Date(t.endedAt).getTime() >= cutoff);
}

// Build the complete derived profile for a user: totals, eco, CO2, battery, loyalty.
function buildProfile(db, userId) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  const vehicles = db.vehicles.filter((v) => v.userId === userId);
  const trips = tripsForUser(db, userId);
  const weekTrips = withinDays(trips, 7);

  const lifetimePoints = trips.reduce((s, t) => s + (t.pointsEarned || 0), 0);
  const impact = co2.summarize(trips);
  const avgEco = trips.length ? trips.reduce((s, t) => s + (t.ecoScore || 0), 0) / trips.length : 0;
  const weekAvgEco = weekTrips.length ? weekTrips.reduce((s, t) => s + (t.ecoScore || 0), 0) / weekTrips.length : 0;
  const weekCo2 = weekTrips.reduce((s, t) => s + (t.co2SavedKg || 0), 0);

  const primaryVehicle = vehicles[0];
  const batteryReport = primaryVehicle ? battery.fullReport(primaryVehicle) : null;
  const streak = rewards.computeStreak(trips.map((t) => t.endedAt));

  const stats = {
    tripCount: trips.length,
    avgEco,
    weekAvgEco,
    weekCo2,
    totalCo2: impact.totalCo2SavedKg,
    totalDistance: impact.totalDistanceKm,
    streak,
    careScore: batteryReport ? batteryReport.careScore : 0,
  };

  const tier = rewards.tierFor(lifetimePoints);
  // Tier multiplier applies to redeemable balance after redemptions.
  const spent = (db.redemptions || [])
    .filter((r) => r.userId === userId)
    .reduce((s, r) => s + r.cost, 0);
  const balance = Math.max(0, Math.round(lifetimePoints * tier.multiplier) - spent);

  return {
    user,
    vehicles,
    primaryVehicle,
    tripCount: trips.length,
    recentTrips: trips.slice(-10).reverse(),
    impact,
    avgEcoScore: Math.round(avgEco),
    avgEcoGrade: scoring.grade(avgEco),
    battery: batteryReport,
    loyalty: {
      lifetimePoints,
      balance,
      spent,
      tier,
      streak,
      streakBonusAvailable: streak > 0,
      badges: rewards.earnedBadges(stats),
      challenges: rewards.challenges(stats),
    },
  };
}

function leaderboardEntry(db, user) {
  const trips = tripsForUser(db, user.id);
  const lifetimePoints = trips.reduce((s, t) => s + (t.pointsEarned || 0), 0);
  const impact = co2.summarize(trips);
  const avgEco = trips.length ? trips.reduce((s, t) => s + (t.ecoScore || 0), 0) / trips.length : 0;
  return {
    userId: user.id,
    name: user.name,
    isPrimary: !!user.isPrimary,
    points: lifetimePoints,
    tier: rewards.tierFor(lifetimePoints).name,
    co2SavedKg: impact.totalCo2SavedKg,
    avgEco: Math.round(avgEco),
    distanceKm: impact.totalDistanceKm,
  };
}

const PRIMARY_USER = 'u_you';

// ----- API ------------------------------------------------------------------

// Full dashboard payload for the primary (or ?userId) driver.
app.get('/api/me', (req, res) => {
  const db = store.read();
  const userId = req.query.userId || PRIMARY_USER;
  const profile = buildProfile(db, userId);
  if (!profile) return res.status(404).json({ error: 'user not found' });
  res.json(profile);
});

// Trip history with derived eco feedback.
app.get('/api/trips', (req, res) => {
  const db = store.read();
  const userId = req.query.userId || PRIMARY_USER;
  const limit = Number(req.query.limit || 50);
  const trips = tripsForUser(db, userId)
    .slice(-limit)
    .reverse()
    .map((t) => ({ ...t, feedback: scoring.tripFeedback(t) }));
  res.json(trips);
});

// Simulate a brand-new trip (the "drive now" hook). Updates battery cycle wear too.
app.post('/api/trips/simulate', (req, res) => {
  const userId = req.body.userId || PRIMARY_USER;
  const result = store.update((db) => {
    const vehicle = db.vehicles.find((v) => v.userId === userId);
    if (!vehicle) return { error: 'no vehicle' };
    // If the client passed explicit Simulator Lab parameters, log exactly that drive;
    // otherwise fall back to a random realistic trip.
    const p = req.body.params;
    const trip = p
      ? simulator.tripFromParams(vehicle.id, p)
      : simulator.generateTrip(vehicle.id, { profile: req.body.profile, skill: req.body.skill });
    db.trips.push(trip);
    // Reflect usage on the pack: partial cycle + odometer.
    vehicle.battery.cycleCount = (vehicle.battery.cycleCount || 0) + trip.energyUsedKwh / vehicle.batteryCapacityKwh;
    vehicle.battery.cycleCount = Math.round(vehicle.battery.cycleCount * 100) / 100;
    vehicle.odometerKm = Math.round((vehicle.odometerKm || 0) + trip.distanceKm);
    return { trip };
  });
  if (result.error) return res.status(400).json(result);
  const db = store.read();
  res.json({ trip: { ...result.trip, feedback: scoring.tripFeedback(result.trip) }, profile: buildProfile(db, userId) });
});

// Battery deep-dive for a vehicle.
app.get('/api/battery/:vehicleId', (req, res) => {
  const db = store.read();
  const vehicle = db.vehicles.find((v) => v.id === req.params.vehicleId);
  if (!vehicle) return res.status(404).json({ error: 'vehicle not found' });
  res.json({ vehicle, report: battery.fullReport(vehicle) });
});

// CO2 / cost impact summary.
app.get('/api/impact', (req, res) => {
  const db = store.read();
  const userId = req.query.userId || PRIMARY_USER;
  const trips = tripsForUser(db, userId);
  res.json(co2.summarize(trips));
});

// Reward catalogue + the driver's current balance.
app.get('/api/rewards', (req, res) => {
  const db = store.read();
  const userId = req.query.userId || PRIMARY_USER;
  const profile = buildProfile(db, userId);
  res.json({
    catalog: rewards.REWARD_CATALOG,
    balance: profile.loyalty.balance,
    tier: profile.loyalty.tier,
    redemptions: (db.redemptions || []).filter((r) => r.userId === userId).reverse(),
  });
});

// Redeem a reward, spending points.
app.post('/api/rewards/redeem', (req, res) => {
  const userId = req.body.userId || PRIMARY_USER;
  const itemId = req.body.itemId;
  const item = rewards.REWARD_CATALOG.find((r) => r.id === itemId);
  if (!item) return res.status(400).json({ error: 'unknown reward' });

  const db = store.read();
  const profile = buildProfile(db, userId);
  if (profile.loyalty.balance < item.cost) {
    return res.status(400).json({ error: 'insufficient points', balance: profile.loyalty.balance });
  }
  const redemption = {
    id: 'rdm_' + Date.now().toString(36),
    userId,
    itemId: item.id,
    name: item.name,
    cost: item.cost,
    redeemedAt: new Date().toISOString(),
    code: (item.id.slice(0, 4) + Math.random().toString(36).slice(2, 8)).toUpperCase(),
  };
  store.update((d) => {
    d.redemptions = d.redemptions || [];
    d.redemptions.push(redemption);
  });
  const updated = buildProfile(store.read(), userId);
  res.json({ redemption, balance: updated.loyalty.balance });
});

// Challenges + badges for the driver.
app.get('/api/challenges', (req, res) => {
  const db = store.read();
  const userId = req.query.userId || PRIMARY_USER;
  const profile = buildProfile(db, userId);
  res.json({ challenges: profile.loyalty.challenges, badges: profile.loyalty.badges, streak: profile.loyalty.streak });
});

// Community leaderboard across the fleet.
app.get('/api/leaderboard', (req, res) => {
  const db = store.read();
  const metric = req.query.metric || 'points';
  const entries = db.users.map((u) => leaderboardEntry(db, u));
  const key = ['points', 'co2SavedKg', 'avgEco', 'distanceKm'].includes(metric) ? metric : 'points';
  entries.sort((a, b) => b[key] - a[key]);
  entries.forEach((e, i) => (e.rank = i + 1));
  res.json({ metric: key, entries });
});

// Reset + re-seed (handy for demos).
app.post('/api/reset', (req, res) => {
  store.reset();
  store.write(seedModule.seed());
  res.json({ ok: true });
});

// Selectable demo personas — each driver tells a different product story.
app.get('/api/personas', (req, res) => {
  const db = store.read();
  res.json(
    db.users.map((u) => {
      const lp = tripsForUser(db, u.id).reduce((s, t) => s + (t.pointsEarned || 0), 0);
      const veh = db.vehicles.find((v) => v.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        persona: u.persona || '',
        isPrimary: !!u.isPrimary,
        tier: rewards.tierFor(lp).name,
        vehicle: veh ? `${veh.make} ${veh.model}` : '',
      };
    })
  );
});

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'drivev', ts: new Date().toISOString() }));

// SPA fallback.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`DrivEv platform running on http://localhost:${PORT}`);
});
