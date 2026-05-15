const GoalProgressStrategy = require("./GoalProgressStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

class BloodPressureStrategy extends GoalProgressStrategy {
  async computeCurrentValue(goal) {
    const dateFilter = this.buildDateFilter(goal);
    const unit = goal.unit || "";

    // Days: count of days with BP < 130/85
    if (unitMatches(unit, "day")) {
      const agg = await this.models.BloodPressure.aggregate([
        { $match: { ...dateFilter, systolic: { $lt: 130 }, diastolic: { $lt: 85 } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
      ]);
      return agg.length;
    }

    // Readings: count of entries
    if (unitMatches(unit, "reading")) {
      return await this.models.BloodPressure.countDocuments(dateFilter);
    }

    // mmHg/systolic: use latest reading instead of average
    if (unitMatches(unit, "mmhg")) {
      const latest = await this.models.BloodPressure.findOne(dateFilter).sort({ date: -1 }).lean();
      return latest ? latest.systolic : 0;
    }

    // Default: count of entries
    return await this.models.BloodPressure.countDocuments(dateFilter);
  }

  /**
   * For "keep under" goals (mmHg/systolic), being at or below target = success.
   * Progress is calculated based on latest reading vs target.
   */
  getProgress(goal) {
    const gUnit = goal.unit || "";
    const isKeepUnder = unitMatches(gUnit, "mmhg");

    if (isKeepUnder && goal.targetValue > 0) {
      const completed = goal.currentValue <= goal.targetValue;
      if (completed) return 100;
      // For keep-under goals: if current is 2x target, 0% progress. If at target, 100%.
      if (goal.currentValue === 0) return 0;
      const ratio = goal.targetValue / goal.currentValue;
      return Math.max(0, Math.min(Math.round(ratio * 100), 99));
    }
    return super.getProgress(goal);
  }

  isCompleted(goal) {
    const gUnit = goal.unit || "";
    const isKeepUnder = unitMatches(gUnit, "mmhg");
    if (isKeepUnder && goal.targetValue > 0) {
      return goal.currentValue <= goal.targetValue;
    }
    return super.isCompleted(goal);
  }
}

module.exports = BloodPressureStrategy;
