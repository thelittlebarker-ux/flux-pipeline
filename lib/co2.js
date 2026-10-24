// CO2 + cost savings model: what did driving electric (or electrified) actually save
// vs an equivalent petrol car, both for the planet and the wallet. Powertrain-aware so
// BEV, PHEV and HEV are each scored fairly.
const C = require('./config');

function powertrain(pt) {
  return C.POWERTRAINS[pt] || C.POWERTRAINS.BEV;
}

// Net CO2 avoided on a single trip (kg) vs a comparable petrol car. Baseline is the
// full-petrol emissions; actual is grid emissions for the electric share plus the
// (reduced) combustion emissions for any hybrid petrol share.
function tripCo2SavedKg(distanceKm, energyUsedKwh, pt = 'BEV') {
  const p = powertrain(pt);
  const baseline = distanceKm * C.ICE_CO2_PER_KM;
  const evEmissions = energyUsedKwh * C.GRID_CO2_PER_KWH;
  const fuelLitres = distanceKm * (1 - p.electricShare) * C.ICE_FUEL_PER_KM * (p.hybridFuelFactor || 0);
  const combustionEmissions = fuelLitres * C.PETROL_CO2_PER_L;
  return round(Math.max(0, baseline - evEmissions - combustionEmissions), 3);
}

// Fuel cost avoided (currency units). pricePerLitre is configurable per market.
function tripFuelSavedCost(distanceKm, energyUsedKwh, pt = 'BEV', opts = {}) {
  const p = powertrain(pt);
  const pricePerLitre = opts.pricePerLitre ?? 1.7;
  const pricePerKwh = opts.pricePerKwh ?? 0.28;
  const iceFuelCost = distanceKm * C.ICE_FUEL_PER_KM * pricePerLitre;
  const hybridFuelLitres = distanceKm * (1 - p.electricShare) * C.ICE_FUEL_PER_KM * (p.hybridFuelFactor || 0);
  const actualCost = energyUsedKwh * pricePerKwh + hybridFuelLitres * pricePerLitre;
  return round(iceFuelCost - actualCost, 2);
}

function treesEquivalent(totalCo2Kg) {
  return round(totalCo2Kg / C.CO2_PER_TREE_YEAR, 1);
}

// Roll a set of trips into a headline impact summary. Each trip carries its powertrain.
function summarize(trips, opts = {}) {
  const totalCo2 = trips.reduce((s, t) => s + (t.co2SavedKg || 0), 0);
  const totalDistance = trips.reduce((s, t) => s + (t.distanceKm || 0), 0);
  const totalEnergy = trips.reduce((s, t) => s + (t.energyUsedKwh || 0), 0);
  // Petrol litres AVOIDED = full-ICE baseline litres minus litres actually burned.
  const litresAvoided = trips.reduce((s, t) => {
    const p = powertrain(t.powertrain);
    const baseline = t.distanceKm * C.ICE_FUEL_PER_KM;
    const burned = t.distanceKm * (1 - p.electricShare) * C.ICE_FUEL_PER_KM * (p.hybridFuelFactor || 0);
    return s + (baseline - burned);
  }, 0);
  const costSaved = trips.reduce(
    (s, t) => s + tripFuelSavedCost(t.distanceKm || 0, t.energyUsedKwh || 0, t.powertrain, opts),
    0
  );
  return {
    totalCo2SavedKg: round(totalCo2, 1),
    totalDistanceKm: round(totalDistance, 0),
    totalEnergyKwh: round(totalEnergy, 1),
    fuelLitresAvoided: round(litresAvoided, 0),
    costSaved: round(costSaved, 0),
    treesEquivalent: treesEquivalent(totalCo2),
    gridIntensity: C.GRID_CO2_PER_KWH,
  };
}

function round(n, d = 2) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

module.exports = { tripCo2SavedKg, tripFuelSavedCost, treesEquivalent, summarize, powertrain };
