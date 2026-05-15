/**
 * Base class for goal progress computation strategies.
 * Each category (activity, nutrition, sleep, etc.) implements its own strategy.
 */
class GoalProgressStrategy {
  constructor(models) {
    this.models = models;
  }

  /**
   * Compute the current value for a goal based on tracked data.
   * @param {Object} goal - The goal document
   * @returns {Promise<number>} - The computed current value
   */
  async computeCurrentValue(goal) {
    throw new Error("computeCurrentValue must be implemented by subclass");
  }

  /**
   * Get the progress percentage for a goal.
   * Default implementation: (currentValue / targetValue) * 100
   * Override for custom logic (e.g., weight baseline, "keep under" goals).
   * @param {Object} goal - The goal document with computed currentValue
   * @returns {number} - Progress percentage (0-100)
   */
  getProgress(goal) {
    if (!goal.targetValue || goal.targetValue <= 0) return 0;
    const pct = (goal.currentValue / goal.targetValue) * 100;
    return Math.max(0, Math.min(Math.round(pct), 100));
  }

  /**
   * Determine if a goal is completed.
   * Default implementation: currentValue >= targetValue
   * Override for custom logic.
   * @param {Object} goal - The goal document with computed currentValue
   * @returns {boolean}
   */
  isCompleted(goal) {
    return goal.targetValue > 0 && goal.currentValue >= goal.targetValue;
  }

  /**
   * Build date filter for aggregation queries.
   * Simplified to use userId only - all-time data for progress calculation.
   * @param {Object} goal - The goal document
   * @returns {Object} - MongoDB date filter
   */
  buildDateFilter(goal) {
    return { userId: goal.userId };
  }
}

module.exports = GoalProgressStrategy;
