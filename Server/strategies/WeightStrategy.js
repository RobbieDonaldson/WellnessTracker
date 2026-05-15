const GoalProgressStrategy = require("./GoalProgressStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

class WeightStrategy extends GoalProgressStrategy {
  async computeCurrentValue(goal) {
    // Latest weight reading
    const latest = await this.models.Weight.findOne({ userId: goal.userId }).sort({ date: -1 }).lean();
    if (!latest) return 0;

    const unit = (goal.unit || "").toLowerCase().trim();
    if (unitMatches(unit, "kilogram")) {
      return latest.unit === "kg" ? latest.value : Math.round(latest.value / 2.20462 * 10) / 10;
    }
    return latest.unit === "lbs" ? latest.value : Math.round(latest.value * 2.20462 * 10) / 10;
  }

  /**
   * Weight goals use baseline-based progress calculation.
   * Find baseline weight (first recorded) and compute progress relative to target.
   * Progress is based on change from baseline toward target.
   */
  async getProgress(goal) {
    if (!goal.targetValue || goal.targetValue <= 0) return 0;

    // Get baseline (first recorded weight)
    const baseline = await this.models.Weight.findOne({ userId: goal.userId }).sort({ date: 1 }).lean();
    if (!baseline) return 0;

    // Convert baseline to goal unit
    const unit = (goal.unit || "").toLowerCase().trim();
    let baseVal;
    if (unitMatches(unit, "kilogram")) {
      baseVal = baseline.unit === "kg" ? baseline.value : Math.round(baseline.value / 2.20462 * 10) / 10;
    } else {
      baseVal = baseline.unit === "lbs" ? baseline.value : Math.round(baseline.value * 2.20462 * 10) / 10;
    }

    // Calculate progress based on change from baseline toward target
    const current = goal.currentValue;
    const target = goal.targetValue;

    // If losing weight (baseline > target)
    if (baseVal > target) {
      const totalToLose = baseVal - target;
      const lost = baseVal - current;
      return totalToLose > 0 ? Math.max(0, Math.min(Math.round((lost / totalToLose) * 100), 100)) : 0;
    }
    // If gaining weight (baseline < target)
    else if (baseVal < target) {
      const totalToGain = target - baseVal;
      const gained = current - baseVal;
      return totalToGain > 0 ? Math.max(0, Math.min(Math.round((gained / totalToGain) * 100), 100)) : 0;
    }
    // Already at target
    else {
      return 100;
    }
  }

  /**
   * Weight completion is direction-aware (loss vs gain).
   */
  async isCompleted(goal) {
    const current = goal.currentValue;
    const target = goal.targetValue;

    // Get baseline to determine direction
    const baseline = await this.models.Weight.findOne({ userId: goal.userId }).sort({ date: 1 }).lean();
    if (!baseline) return false;

    const unit = (goal.unit || "").toLowerCase().trim();
    let baseVal;
    if (unitMatches(unit, "kilogram")) {
      baseVal = baseline.unit === "kg" ? baseline.value : Math.round(baseline.value / 2.20462 * 10) / 10;
    } else {
      baseVal = baseline.unit === "lbs" ? baseline.value : Math.round(baseline.value * 2.20462 * 10) / 10;
    }

    // Loss goal: completed when current <= target
    if (baseVal > target) {
      return current <= target;
    }
    // Gain goal: completed when current >= target
    else if (baseVal < target) {
      return current >= target;
    }
    // Already at target
    else {
      return true;
    }
  }
}

module.exports = WeightStrategy;
