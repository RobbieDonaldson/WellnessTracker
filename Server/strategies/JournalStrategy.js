const GoalProgressStrategy = require("./GoalProgressStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

class JournalStrategy extends GoalProgressStrategy {
  async computeCurrentValue(goal) {
    const dateFilter = this.buildDateFilter(goal);
    const unit = goal.unit || "";

    // Days: count of unique dates with journal entries
    if (unitMatches(unit, "day")) {
      const agg = await this.models.Journal.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
      ]);
      return agg.length;
    }

    // Entries: count of journal entries
    if (unitMatches(unit, "entry")) {
      return await this.models.Journal.countDocuments(dateFilter);
    }

    // Default: count of entries
    return await this.models.Journal.countDocuments(dateFilter);
  }
}

module.exports = JournalStrategy;
