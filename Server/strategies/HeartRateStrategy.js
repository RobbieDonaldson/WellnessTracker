const GoalProgressStrategy = require("./GoalProgressStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

class HeartRateStrategy extends GoalProgressStrategy {
  async computeCurrentValue(goal) {
    const dateFilter = this.buildDateFilter(goal);
    const unit = goal.unit || "";

    // Days: count of unique dates with readings
    if (unitMatches(unit, "day")) {
      const agg = await this.models.HeartRate.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
      ]);
      return agg.length;
    }

    // Readings: count of entries
    if (unitMatches(unit, "reading")) {
      return await this.models.HeartRate.countDocuments(dateFilter);
    }

    // BPM: use latest reading instead of average
    if (unitMatches(unit, "bpm")) {
      const latest = await this.models.HeartRate.findOne(dateFilter).sort({ date: -1 }).lean();
      return latest ? latest.bpm : 0;
    }

    // Default: count of entries
    return await this.models.HeartRate.countDocuments(dateFilter);
  }

  /**
   * For "keep under" goals (bpm), being at or below target = success.
   * Progress is calculated based on latest reading vs target.
   */
  getProgress(goal) {
    const gUnit = goal.unit || "";
    const isKeepUnder = unitMatches(gUnit, "bpm");

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
    const isKeepUnder = unitMatches(gUnit, "bpm");
    if (isKeepUnder && goal.targetValue > 0) {
      return goal.currentValue <= goal.targetValue;
    }
    return super.isCompleted(goal);
  }
}

module.exports = HeartRateStrategy;
