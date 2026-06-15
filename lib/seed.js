// Seed the platform with a realistic primary driver + a small fleet of peers so the
// dashboard, leaderboard and rewards all have something to show on first run.
const simulator = require('./simulator');

function vehicle(id, userId, make, model, year, powertrain, capacity, range, odometerKm, inServiceDate, battery) {
  return {
    id,
    userId,
    make,
    model,
    year,
    powertrain, // BEV | PHEV | HEV
    batteryCapacityKwh: capacity,
    ratedRangeKm: range, // electric (EV-mode) range
    odometerKm,
    inServiceDate,
    battery: { sohPct: undefined, ...battery },
  };
}

function seed() {
  const users = [
    { id: 'u_you', name: 'You', handle: 'you', joinedAt: '2024-09-01', isPrimary: true, persona: 'Balanced everyday driver' },
    { id: 'u_maya', name: 'Maya Chen', handle: 'maya', joinedAt: '2024-06-10', persona: 'Eco Ace — near-flawless efficiency' },
    { id: 'u_omar', name: 'Omar Haddad', handle: 'omar', joinedAt: '2024-07-22', persona: 'At-risk battery habits — needs coaching' },
    { id: 'u_lena', name: 'Lena Fischer', handle: 'lena', joinedAt: '2024-08-05', persona: 'Steady, careful commuter' },
    { id: 'u_raj', name: 'Raj Patel', handle: 'raj', joinedAt: '2024-05-18', persona: 'High-mileage veteran' },
    { id: 'u_sofia', name: 'Sofia Rossi', handle: 'sofia', joinedAt: '2024-10-02', persona: 'Newcomer & weekend road-tripper' },
  ].map((u) => ({
    ...u,
    points: 0,
    lifetimePoints: 0,
    tier: 'Bronze',
    redemptions: [],
    badges: [],
  }));

  const vehicles = [
    // BEV — primary driver
    vehicle('v_you', 'u_you', 'DrivEv', 'Aero S', 2024, 'BEV', 77, 510, 14800, '2024-09-01', {
      cycleCount: 180, fastChargePct: 28, avgChargeCeiling: 82, avgTempC: 27, deepDischargePct: 9,
    }),
    // BEV — eco ace
    vehicle('v_maya', 'u_maya', 'DrivEv', 'Aero LR', 2023, 'BEV', 84, 560, 31200, '2023-06-10', {
      cycleCount: 320, fastChargePct: 18, avgChargeCeiling: 80, avgTempC: 24, deepDischargePct: 6,
    }),
    // PHEV — at-risk battery habits
    vehicle('v_omar', 'u_omar', 'DrivEv', 'Urban PHEV', 2023, 'PHEV', 18, 85, 38400, '2023-07-22', {
      cycleCount: 410, fastChargePct: 55, avgChargeCeiling: 90, avgTempC: 33, deepDischargePct: 22,
    }),
    // HEV — steady, careful commuter (self-charging, no plug)
    vehicle('v_lena', 'u_lena', 'DrivEv', 'City HEV', 2024, 'HEV', 1.6, 3, 21500, '2024-08-05', {
      cycleCount: 540, fastChargePct: 0, avgChargeCeiling: 70, avgTempC: 24, deepDischargePct: 4,
    }),
    // BEV — high-mileage veteran
    vehicle('v_raj', 'u_raj', 'DrivEv', 'Aero LR', 2022, 'BEV', 84, 560, 96500, '2022-05-18', {
      cycleCount: 620, fastChargePct: 40, avgChargeCeiling: 85, avgTempC: 29, deepDischargePct: 14,
    }),
    // PHEV — newcomer & weekend road-tripper
    vehicle('v_sofia', 'u_sofia', 'DrivEv', 'Urban PHEV', 2024, 'PHEV', 18, 85, 9200, '2024-10-02', {
      cycleCount: 90, fastChargePct: 15, avgChargeCeiling: 78, avgTempC: 23, deepDischargePct: 5,
    }),
  ];

  // Distinct driver skill levels so the leaderboard isn't flat.
  const skills = { u_you: 0.82, u_maya: 0.9, u_omar: 0.55, u_lena: 0.85, u_raj: 0.7, u_sofia: 0.93 };

  let trips = [];
  for (const v of vehicles) {
    const days = v.userId === 'u_you' ? 50 : 40;
    trips = trips.concat(
      simulator.generateHistory(v.id, { days, perDay: [0, 3], skill: skills[v.userId], powertrain: v.powertrain })
    );
  }

  return { users, vehicles, trips, redemptions: [], meta: { seededAt: new Date().toISOString() } };
}

module.exports = { seed };
