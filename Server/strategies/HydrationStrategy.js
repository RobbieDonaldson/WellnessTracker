const GoalProgressStrategy = require("./GoalProgressStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

class HydrationStrategy extends GoalProgressStrategy {
  async computeCurrentValue(goal) {
    const dateFilter = this.buildDateFilter(goal);
    const unit = goal.unit || "";

    // Days: count of days meeting threshold (from explicit threshold field, fallback to 64 oz)
    if (unitMatches(unit, "day")) {
      const threshold = goal.threshold || 64;
      const agg = await this.models.WaterIntake.aggregate([
        { $match: dateFilter },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalOz: { $sum: { $cond: [{ $eq: ["$unit", "ml"] }, { $multiply: ["$amount", 0.033814] }, "$amount"] } }
        } },
        { $match: { totalOz: { $gte: threshold } } },
      ]);
      return agg.length;
    }

    // Ounces: sum of water intake (convert ml to oz)
    if (unitMatches(unit, "ounce")) {
      const agg = await this.models.WaterIntake.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ["$unit", "ml"] }, { $multiply: ["$amount", 0.033814] }, "$amount"] } } } },
      ]);
      return Math.round((agg[0]?.total || 0) * 10) / 10;
    }

    // Milliliters: sum of water intake (convert oz to ml)
    if (unitMatches(unit, "milliliter")) {
      const agg = await this.models.WaterIntake.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ["$unit", "oz"] }, { $multiply: ["$amount", 29.5735] }, "$amount"] } } } },
      ]);
      return Math.round(agg[0]?.total || 0);
    }

    // Default: count of entries
    return await this.models.WaterIntake.countDocuments(dateFilter);
  }
}

module.exports = HydrationStrategy;
