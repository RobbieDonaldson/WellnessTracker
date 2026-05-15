/**
 * Unit normalization utility.
 * Maps various unit aliases to canonical forms for consistent matching.
 */

const UNIT_ALIASES = {
  // Time units
  day: ["day", "days"],
  night: ["night", "nights"],
  minute: ["min", "mins", "minutes", "minute"],
  hour: ["hour", "hours", "hrs"],
  
  // Distance units
  mile: ["mile", "miles", "mi"],
  kilometer: ["km", "kilometers", "kilometer"],
  
  // Volume units
  ounce: ["oz", "ounces", "ounce"],
  milliliter: ["ml", "milliliters", "milliliter"],
  
  // Weight units
  pound: ["lbs", "pounds", "pound", "lb"],
  kilogram: ["kg", "kilograms", "kilogram"],
  
  // Energy units
  calorie: ["cal", "cals", "calories", "kcal", "calorie"],
  
  // Vital units
  mmhg: ["mmhg", "mm hg", "mm-hg", "systolic", "diastolic"],
  mgdl: ["mg/dl", "mgdl", "mg/dL", "mg", "milligrams per deciliter"],
  bpm: ["bpm", "beats per minute"],
  
  // Count units
  reading: ["reading", "readings"],
  entry: ["entry", "entries"],
  step: ["step", "steps"],
  
  // Nutrition units
  protein: ["g protein", "protein", "grams protein", "g"],
};

/**
 * Normalize a unit string to its canonical form.
 * @param {string} unit - The unit string to normalize
 * @returns {string} - The canonical unit, or the original if no match found
 */
function normalizeUnit(unit) {
  if (!unit) return "";
  const normalized = unit.toLowerCase().trim();
  
  for (const [canonical, aliases] of Object.entries(UNIT_ALIASES)) {
    if (aliases.includes(normalized)) {
      return canonical;
    }
  }
  
  return normalized; // Return original if no alias match
}

/**
 * Check if a unit matches any of the given canonical units.
 * @param {string} unit - The unit string to check
 * @param {...string} canonicalUnits - The canonical units to match against
 * @returns {boolean}
 */
function unitMatches(unit, ...canonicalUnits) {
  const normalized = normalizeUnit(unit);
  return canonicalUnits.includes(normalized);
}

module.exports = { normalizeUnit, unitMatches, UNIT_ALIASES };
