/**
 * Unit conversion utilities based on user's unit preference (metric vs standard)
 */

// Conversion factors
const LBS_TO_KG = 0.45359237;
const KG_TO_LBS = 2.20462;
const MI_TO_KM = 1.609344;
const KM_TO_MI = 0.621371;
const OZ_TO_ML = 29.5735;
const ML_TO_OZ = 0.033814;

// Weight conversions
export function convertWeight(value, fromUnit, toUnit) {
  if (value === null || value === undefined || value === "") return value;
  const numValue = Number(value);
  if (isNaN(numValue)) return value;
  
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) return numValue;
  
  // Convert to kg first
  const inKg = fromUnit === "kg" ? numValue : numValue * LBS_TO_KG;
  
  // Convert to target unit
  if (toUnit === "kg") return inKg;
  return inKg * KG_TO_LBS;
}

// Distance conversions
export function convertDistance(value, fromUnit, toUnit) {
  if (value === null || value === undefined || value === "") return value;
  const numValue = Number(value);
  if (isNaN(numValue)) return value;
  
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) return numValue;
  
  // Convert to km first
  const inKm = fromUnit === "km" ? numValue : numValue * MI_TO_KM;
  
  // Convert to target unit
  if (toUnit === "km") return inKm;
  return inKm * KM_TO_MI;
}

// Volume conversions (water intake)
export function convertVolume(value, fromUnit, toUnit) {
  if (value === null || value === undefined || value === "") return value;
  const numValue = Number(value);
  if (isNaN(numValue)) return value;
  
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) return numValue;
  
  // Convert to ml first
  const inMl = fromUnit === "ml" ? numValue : numValue * OZ_TO_ML;
  
  // Convert to target unit
  if (toUnit === "ml") return inMl;
  return inMl * ML_TO_OZ;
}

// Get display unit based on user preference
export function getWeightUnit(unitPreference) {
  return unitPreference === "metric" ? "kg" : "lbs";
}

export function getDistanceUnit(unitPreference) {
  return unitPreference === "metric" ? "km" : "mi";
}

export function getVolumeUnit(unitPreference) {
  return unitPreference === "metric" ? "ml" : "oz";
}

// Format value with unit
export function formatWithUnit(value, unit) {
  if (value === null || value === undefined) return "—";
  return `${value} ${unit}`;
}
