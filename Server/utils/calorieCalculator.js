// MET (Metabolic Equivalent of Task) values by activity type
// Source: Compendium of Physical Activities
const MET_VALUES = {
  running: 9.8,
  walking: 3.5,
  cycling: 7.5,
  swimming: 8.0,
  weightlifting: 6.0,
  yoga: 3.0,
  hiking: 6.0,
  other: 5.0,
};

/**
 * Estimate calories burned using the MET formula.
 * Calories = MET × weight(kg) × duration(hours)
 *
 * @param {string} activityType - one of the known activity types
 * @param {number} durationMinutes - duration in minutes
 * @param {number} weightLbs - body weight in pounds
 * @returns {number} estimated calories burned (rounded)
 */
function estimateCalories(activityType, durationMinutes, weightLbs) {
  const met = MET_VALUES[activityType] || MET_VALUES.other;
  const weightKg = weightLbs / 2.205;
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}

module.exports = { estimateCalories, MET_VALUES };
