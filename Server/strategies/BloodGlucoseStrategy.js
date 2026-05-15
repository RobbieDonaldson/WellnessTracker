const GoalProgressStrategy = require("./GoalProgressStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

class BloodGlucoseStrategy extends GoalProgressStrategy {
  async computeCurrentValue(goal) {
    const dateFilter = this.buildDateFilter(goal);
    const unit = goal.unit || "";

    // Days: count of days with average glucose below threshold (from explicit threshold field, fallback to 100)
    if (unitMatches(unit, "day")) {
      const threshold = goal.threshold || 100;
      const agg = await this.models.BloodGlucose.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, avg: { $avg: "$level" } } },
        { $match: { avg: { $lt: threshold } } },
      ]);
      return agg.length;
    }

    // Readings: count of entries
    if (unitMatches(unit, "reading")) {
      return await this.models.BloodGlucose.countDocuments(dateFilter);
    }

    // mg/dL: use latest reading instead of average
    if (unitMatches(unit, "mgdl")) {
      const latest = await this.models.BloodGlucose.findOne(dateFilter).sort({ date: -1 }).lean();
      return latest ? latest.level : 0;
    }

    // Default: count of entries
    return await this.models.BloodGlucose.countDocuments(dateFilter);
  }

  /**
   * For "keep under" goals (mg/dL), being at or below target = success.
   * Progress is calculated based on latest reading vs target.
   */
  getProgress(goal) {
    const gUnit = goal.unit || "";
    const isKeepUnder = unitMatches(gUnit, "mgdl");

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
    const isKeepUnder = unitMatches(gUnit, "mgdl");
    if (isKeepUnder && goal.targetValue > 0) {
      return goal.currentValue <= goal.targetValue;
    }
    return super.isCompleted(goal);
  }
}

module.exports = BloodGlucoseStrategy;
