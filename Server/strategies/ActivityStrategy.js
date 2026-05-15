const GoalProgressStrategy = require("./GoalProgressStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

class ActivityStrategy extends GoalProgressStrategy {
  async computeCurrentValue(goal) {
    const dateFilter = this.buildDateFilter(goal);
    const unit = goal.unit || "";

    // Days: count of unique dates with activities
    if (unitMatches(unit, "day")) {
      const agg = await this.models.Activity.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
      ]);
      return agg.length;
    }

    // Minutes: sum of duration
    if (unitMatches(unit, "minute")) {
      const agg = await this.models.Activity.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$duration" } } },
      ]);
      return agg[0]?.total || 0;
    }

    // Hours: sum of duration converted to hours
    if (unitMatches(unit, "hour")) {
      const agg = await this.models.Activity.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$duration" } } },
      ]);
      return Math.round(((agg[0]?.total || 0) / 60) * 10) / 10;
    }

    // Miles: sum of distance (convert km to mi)
    if (unitMatches(unit, "mile")) {
      const agg = await this.models.Activity.aggregate([
        { $match: { ...dateFilter, distance: { $ne: null } } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: [
                  { $eq: ["$distanceUnit", "km"] },
                  { $multiply: ["$distance", 0.621371] },
                  "$distance"
                ]
              }
            }
          }
        },
      ]);
      return Math.round((agg[0]?.total || 0) * 100) / 100;
    }

    // Kilometers: sum of distance (convert mi to km)
    if (unitMatches(unit, "kilometer")) {
      const agg = await this.models.Activity.aggregate([
        { $match: { ...dateFilter, distance: { $ne: null } } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: [
                  { $eq: ["$distanceUnit", "mi"] },
                  { $multiply: ["$distance", 1.60934] },
                  "$distance"
                ]
              }
            }
          }
        },
      ]);
      return Math.round((agg[0]?.total || 0) * 100) / 100;
    }

    // Steps: sum of steps
    if (unitMatches(unit, "step")) {
      const agg = await this.models.Activity.aggregate([
        { $match: { ...dateFilter, steps: { $ne: null } } },
        { $group: { _id: null, total: { $sum: "$steps" } } },
      ]);
      return agg[0]?.total || 0;
    }

    // Calories: sum of calories burned
    if (unitMatches(unit, "calorie")) {
      const agg = await this.models.Activity.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$caloriesBurned" } } },
      ]);
      return agg[0]?.total || 0;
    }

    // Default: count of activities
    return await this.models.Activity.countDocuments(dateFilter);
  }
}

module.exports = ActivityStrategy;
