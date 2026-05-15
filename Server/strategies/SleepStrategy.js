const GoalProgressStrategy = require("./GoalProgressStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

class SleepStrategy extends GoalProgressStrategy {
  async computeCurrentValue(goal) {
    const dateFilter = this.buildDateFilter(goal);
    const unit = goal.unit || "";

    // Days/nights: count of consecutive nights meeting threshold (streak)
    if (unitMatches(unit, "day", "night")) {
      const threshold = goal.threshold || 8;
      const records = await this.models.Sleep.find(dateFilter).sort({ date: 1 }).lean();
      
      if (records.length === 0) return 0;

      // Calculate streak of consecutive days with ≥ threshold hours of sleep
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Start from most recent day and work backwards
      let currentDate = new Date(today);
      let recordIndex = records.length - 1;
      
      while (recordIndex >= 0) {
        const recordDate = new Date(records[recordIndex].date);
        recordDate.setHours(0, 0, 0, 0);
        
        // Check if this record matches current date in streak
        if (recordDate.getTime() === currentDate.getTime()) {
          if (records[recordIndex].duration >= threshold) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
            recordIndex--;
          } else {
            // Streak broken
            break;
          }
        } else if (recordDate < currentDate) {
          // Gap in dates, streak broken
          break;
        } else {
          // Record is in future, skip
          recordIndex--;
        }
      }
      
      return streak;
    }

    // Hours: sum of sleep duration
    if (unitMatches(unit, "hour")) {
      const agg = await this.models.Sleep.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$duration" } } },
      ]);
      return Math.round((agg[0]?.total || 0) * 10) / 10;
    }

    // Default: count of sleep entries
    return await this.models.Sleep.countDocuments(dateFilter);
  }

  /**
   * For streak-based goals (days/nights), progress is based on current streak vs target.
   */
  getProgress(goal) {
    const gUnit = goal.unit || "";
    const isStreakGoal = unitMatches(gUnit, "day", "night");

    if (isStreakGoal && goal.targetValue > 0) {
      const completed = goal.currentValue >= goal.targetValue;
      if (completed) return 100;
      // Progress based on current streak vs target
      return Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 99);
    }
    return super.getProgress(goal);
  }

  isCompleted(goal) {
    const gUnit = goal.unit || "";
    const isStreakGoal = unitMatches(gUnit, "day", "night");
    if (isStreakGoal) {
      return goal.targetValue > 0 && goal.currentValue >= goal.targetValue;
    }
    return super.isCompleted(goal);
  }
}

module.exports = SleepStrategy;
