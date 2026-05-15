const GoalProgressStrategy = require("./GoalProgressStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

class NutritionStrategy extends GoalProgressStrategy {
  async computeCurrentValue(goal) {
    const dateFilter = this.buildDateFilter(goal);
    const unit = goal.unit || "";

    // Days: count of unique dates with meals
    if (unitMatches(unit, "day")) {
      const agg = await this.models.Meal.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
      ]);
      return agg.length;
    }

    // Calories: sum of calories
    if (unitMatches(unit, "calorie")) {
      const agg = await this.models.Meal.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$calories" } } },
      ]);
      return agg[0]?.total || 0;
    }

    // Protein: sum of protein grams
    if (unitMatches(unit, "protein")) {
      const agg = await this.models.Meal.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$protein" } } },
      ]);
      return Math.round((agg[0]?.total || 0) * 10) / 10;
    }

    // Default: count of meals
    return await this.models.Meal.countDocuments(dateFilter);
  }
}

module.exports = NutritionStrategy;
