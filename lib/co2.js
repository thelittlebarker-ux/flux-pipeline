// CO2 + cost savings model: what did driving electric actually save vs an equivalent
// petrol car, both for the planet and the wallet.
const C = require('./config');

// Net CO2 avoided on a single trip (kg). Petrol tailpipe emissions minus the grid
// emissions attributable to the energy the EV consumed.
function tripCo2SavedKg(distanceKm, energyUsedKwh) {
  const iceEmissions = distanceKm * C.ICE_CO2_PER_KM;
  const evEmissions = energyUsedKwh * C.GRID_CO2_PER_KWH;
  return Math.max(0, round(iceEmissions - evEmissions, 3));
}

// Fuel cost avoided (currency units). pricePerLitre is configurable per market.
function tripFuelSavedCost(distanceKm, energyUsedKwh, opts = {}) {
  const pricePerLitre = opts.pricePerLitre ?? 1.7;
  const pricePerKwh = opts.pricePerKwh ?? 0.28;
  const iceFuelCost = distanceKm * C.ICE_FUEL_PER_KM * pricePerLitre;
  const evEnergyCost = energyUsedKwh * pricePerKwh;
  return round(iceFuelCost - evEnergyCost, 2);
}

function treesEquivalent(totalCo2Kg) {
  return round(totalCo2Kg / C.CO2_PER_TREE_YEAR, 1);
}

// Roll a set of trips into a headline impact summary.
function summarize(trips, opts = {}) {
  const totalCo2 = trips.reduce((s, t) => s + (t.co2SavedKg || 0), 0);
  const totalDistance = trips.reduce((s, t) => s + (t.distanceKm || 0), 0);
  const totalEnergy = trips.reduce((s, t) => s + (t.energyUsedKwh || 0), 0);
  const fuelLitres = totalDistance * C.ICE_FUEL_PER_KM;
  const costSaved = trips.reduce(
    (s, t) => s + tripFuelSavedCost(t.distanceKm || 0, t.energyUsedKwh || 0, opts),
    0
  );
  return {
    totalCo2SavedKg: round(totalCo2, 1),
    totalDistanceKm: round(totalDistance, 0),
    totalEnergyKwh: round(totalEnergy, 1),
    fuelLitresAvoided: round(fuelLitres, 0),
    costSaved: round(costSaved, 0),
    treesEquivalent: treesEquivalent(totalCo2),
    gridIntensity: C.GRID_CO2_PER_KWH,
  };
}

function round(n, d = 2) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

module.exports = { tripCo2SavedKg, tripFuelSavedCost, treesEquivalent, summarize };
