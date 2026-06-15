// DrivEv platform tunables. Keeping all the domain factors in one place makes the
// scoring/CO2/battery models auditable and easy to localise per market.
module.exports = {
  // --- CO2 ---------------------------------------------------------------
  // Average tailpipe emissions of a comparable petrol vehicle (kg CO2e / km).
  ICE_CO2_PER_KM: 0.192,
  // Grid carbon intensity used to charge the EV (kg CO2e / kWh). Defaults to a
  // moderately clean grid; override per region via GRID_CO2_PER_KWH env var.
  GRID_CO2_PER_KWH: Number(process.env.GRID_CO2_PER_KWH || 0.233),
  // A mature tree absorbs roughly this much CO2 per year (kg).
  CO2_PER_TREE_YEAR: 21,
  // Litres of petrol avoided per km vs the comparable ICE car.
  ICE_FUEL_PER_KM: 0.071,
  // Combustion emissions of petrol actually burned (kg CO2e / litre).
  PETROL_CO2_PER_L: 2.31,

  // --- Powertrains (EV-only platform: BEV, PHEV, HEV) --------------------
  // electricShare: fraction of distance driven on electric power.
  // plugIn: whether the pack is charged from an external supply.
  // hybridFuelFactor: efficiency multiplier on the petrol burned for the
  // non-electric share (full hybrids sip far less than a comparable ICE car).
  POWERTRAINS: {
    BEV: { code: 'BEV', label: 'Battery Electric', electricShare: 1.0, plugIn: true, hybridFuelFactor: 0 },
    PHEV: { code: 'PHEV', label: 'Plug-in Hybrid', electricShare: 0.62, plugIn: true, hybridFuelFactor: 0.78 },
    HEV: { code: 'HEV', label: 'Hybrid', electricShare: 0.30, plugIn: false, hybridFuelFactor: 0.62 },
  },

  // --- Eco driving score -------------------------------------------------
  // Reference consumption (kWh / 100km) for a "perfect" efficient drive.
  EFFICIENCY_TARGET_KWH_100: 15,
  EFFICIENCY_CEILING_KWH_100: 28,
  // Penalty (score points) per event.
  PENALTY_HARSH_BRAKE: 4,
  PENALTY_HARSH_ACCEL: 4,
  PENALTY_SPEEDING_MIN: 1.5,
  PENALTY_IDLE_MIN: 0.5,

  // --- Rewards / loyalty -------------------------------------------------
  POINTS_PER_KM: 1,
  POINTS_ECO_BONUS_MAX: 60, // bonus for a perfect eco score per trip
  POINTS_PER_KG_CO2: 2,
  POINTS_BATTERY_FRIENDLY_CHARGE: 25,
  STREAK_DAILY_BONUS: 20,
  TIERS: [
    { name: 'Bronze', min: 0, multiplier: 1.0, color: '#b08d57' },
    { name: 'Silver', min: 2500, multiplier: 1.1, color: '#9aa5b1' },
    { name: 'Gold', min: 7500, multiplier: 1.25, color: '#e0b341' },
    { name: 'Platinum', min: 20000, multiplier: 1.5, color: '#6ad1e3' },
  ],

  // --- Battery health ----------------------------------------------------
  // Approximate cycle life to 80% SoH for a modern LFP/NMC pack.
  BATTERY_RATED_CYCLES: 1500,
  WARRANTY_YEARS: 8,
  WARRANTY_KM: 160000,
  WARRANTY_SOH_FLOOR: 70,
};
