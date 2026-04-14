const mongoose = require("mongoose");
const Goal = require("../models/Goal");
const Activity = require("../models/Activity");
const Meal = require("../models/Meal");
const Sleep = require("../models/Sleep");
const Weight = require("../models/Weight");
const WaterIntake = require("../models/WaterIntake");
const BloodPressure = require("../models/BloodPressure");
const BloodGlucose = require("../models/BloodGlucose");
const HeartRate = require("../models/HeartRate");
const Journal = require("../models/Journal");
const { paginatedQuery } = require("../utils/queryHelper");

/**
 * Auto-compute currentValue for a goal by aggregating tracked data
 * within the goal's startDate–endDate window.
 */
async function computeProgress(goal) {
  const userId = new mongoose.Types.ObjectId(String(goal.userId));
  const dateFilter = { userId };
  if (goal.startDate || goal.endDate) {
    dateFilter.date = {};
    // Use goal creation timestamp as default start date if startDate not set
    let startDate = goal.startDate ? new Date(goal.startDate) : goal._id.getTimestamp();
    // Validate startDate
    if (isNaN(startDate.getTime())) {
      console.warn(`Invalid startDate for goal ${goal._id}: ${goal.startDate}, using goal creation timestamp`);
      startDate = goal._id.getTimestamp();
    }
    dateFilter.date.$gte = startDate;
    
    if (goal.endDate) {
      const endDate = new Date(goal.endDate);
      // Validate endDate
      if (isNaN(endDate.getTime())) {
        console.warn(`Invalid endDate for goal ${goal._id}: ${goal.endDate}, skipping endDate filter`);
      } else {
        dateFilter.date.$lte = endDate;
      }
    }
  }
  const unit = (goal.unit || "").toLowerCase().trim();

  try {
    switch (goal.category) {
      case "activity": {
        // Support common units: days, minutes, hours, miles, km, steps, calories
        if (["day", "days"].includes(unit)) {
          const agg = await Activity.aggregate([
            { $match: dateFilter },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
          ]);
          return agg.length;
        }
        if (["min", "mins", "minutes"].includes(unit)) {
          const agg = await Activity.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$duration" } } },
          ]);
          return agg[0]?.total || 0;
        }
        if (["hour", "hours", "hrs"].includes(unit)) {
          const agg = await Activity.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$duration" } } },
          ]);
          return Math.round(((agg[0]?.total || 0) / 60) * 10) / 10;
        }
        if (["mile", "miles", "mi"].includes(unit)) {
          const agg = await Activity.aggregate([
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
        if (["km", "kilometers"].includes(unit)) {
          const agg = await Activity.aggregate([
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
        if (["step", "steps"].includes(unit)) {
          const agg = await Activity.aggregate([
            { $match: { ...dateFilter, steps: { $ne: null } } },
            { $group: { _id: null, total: { $sum: "$steps" } } },
          ]);
          return agg[0]?.total || 0;
        }
        if (["cal", "cals", "calories", "kcal"].includes(unit)) {
          const agg = await Activity.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$caloriesBurned" } } },
          ]);
          return agg[0]?.total || 0;
        }
        // Default: count of activities
        return await Activity.countDocuments(dateFilter);
      }

      case "nutrition": {
        if (["day", "days"].includes(unit)) {
          const agg = await Meal.aggregate([
            { $match: dateFilter },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
          ]);
          return agg.length;
        }
        if (["cal", "cals", "calories", "kcal"].includes(unit)) {
          const agg = await Meal.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$calories" } } },
          ]);
          return agg[0]?.total || 0;
        }
        if (["g protein", "protein", "grams protein"].includes(unit)) {
          const agg = await Meal.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$protein" } } },
          ]);
          return Math.round((agg[0]?.total || 0) * 10) / 10;
        }
        // Default: count of meals
        return await Meal.countDocuments(dateFilter);
      }

      case "sleep": {
        if (["day", "days", "night", "nights"].includes(unit)) {
          const agg = await Sleep.aggregate([
            { $match: { ...dateFilter, duration: { $gte: 8 } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
          ]);
          return agg.length;
        }
        if (["hour", "hours", "hrs"].includes(unit)) {
          const agg = await Sleep.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$duration" } } },
          ]);
          return Math.round((agg[0]?.total || 0) * 10) / 10;
        }
        // Default: count of sleep entries
        return await Sleep.countDocuments(dateFilter);
      }

      case "weight": {
        // Latest weight reading
        const latest = await Weight.findOne({ userId }).sort({ date: -1 }).lean();
        if (!latest) return 0;
        if (["kg", "kilograms"].includes(unit)) {
          return latest.unit === "kg" ? latest.value : Math.round(latest.value / 2.205 * 10) / 10;
        }
        return latest.unit === "lbs" ? latest.value : Math.round(latest.value * 2.205 * 10) / 10;
      }

      case "hydration": {
        if (["day", "days"].includes(unit)) {
          // Extract threshold from title (e.g., "Drink 128 oz water daily" extracts 128)
          const match = (goal.title || "").match(/(\d+)\s*oz/i);
          const threshold = match ? parseInt(match[1], 10) : 64;
          const agg = await WaterIntake.aggregate([
            { $match: dateFilter },
            { $group: { 
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              totalOz: { $sum: { $cond: [{ $eq: ["$unit", "ml"] }, { $multiply: ["$amount", 0.033814] }, "$amount"] } }
            } },
            { $match: { totalOz: { $gte: threshold } } },
          ]);
          return agg.length;
        }
        if (["oz", "ounces"].includes(unit)) {
          const agg = await WaterIntake.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ["$unit", "ml"] }, { $multiply: ["$amount", 0.033814] }, "$amount"] } } } },
          ]);
          return Math.round((agg[0]?.total || 0) * 10) / 10;
        }
        if (["ml", "milliliters"].includes(unit)) {
          const agg = await WaterIntake.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ["$unit", "oz"] }, { $multiply: ["$amount", 29.5735] }, "$amount"] } } } },
          ]);
          return Math.round(agg[0]?.total || 0);
        }
        // Default: count of entries
        return await WaterIntake.countDocuments(dateFilter);
      }

      case "blood_pressure": {
        if (["day", "days"].includes(unit)) {
          const agg = await BloodPressure.aggregate([
            { $match: { ...dateFilter, systolic: { $lt: 130 }, diastolic: { $lt: 85 } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
          ]);
          return agg.length;
        }
        if (["reading", "readings"].includes(unit)) {
          return await BloodPressure.countDocuments(dateFilter);
        }
        if (["mmhg", "systolic"].includes(unit)) {
          const agg = await BloodPressure.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, avg: { $avg: "$systolic" } } },
          ]);
          return Math.round(agg[0]?.avg || 0);
        }
        return await BloodPressure.countDocuments(dateFilter);
      }

      case "blood_glucose": {
        if (["day", "days"].includes(unit)) {
          // Extract threshold from title (e.g., "Maintain glucose < 140")
          const match = (goal.title || "").match(/<\s*(\d+)/);
          const threshold = match ? parseInt(match[1], 10) : 100;
          const agg = await BloodGlucose.aggregate([
            { $match: dateFilter },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, avg: { $avg: "$level" } } },
            { $match: { avg: { $lt: threshold } } },
          ]);
          return agg.length;
        }
        if (["reading", "readings"].includes(unit)) {
          return await BloodGlucose.countDocuments(dateFilter);
        }
        if (["mg/dl", "mgdl", "mg"].includes(unit)) {
          const agg = await BloodGlucose.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, avg: { $avg: "$level" } } },
          ]);
          return Math.round(agg[0]?.avg || 0);
        }
        return await BloodGlucose.countDocuments(dateFilter);
      }

      case "heart_rate": {
        if (["day", "days"].includes(unit)) {
          const agg = await HeartRate.aggregate([
            { $match: dateFilter },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
          ]);
          return agg.length;
        }
        if (["reading", "readings"].includes(unit)) {
          return await HeartRate.countDocuments(dateFilter);
        }
        if (["bpm"].includes(unit)) {
          const agg = await HeartRate.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, avg: { $avg: "$bpm" } } },
          ]);
          return Math.round(agg[0]?.avg || 0);
        }
        return await HeartRate.countDocuments(dateFilter);
      }

      case "journal": {
        if (["day", "days"].includes(unit)) {
          const agg = await Journal.aggregate([
            { $match: dateFilter },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
          ]);
          return agg.length;
        }
        if (["entry", "entries"].includes(unit)) {
          return await Journal.countDocuments(dateFilter);
        }
        return await Journal.countDocuments(dateFilter);
      }

      default:
        return goal.currentValue;
    }
  } catch {
    return goal.currentValue;
  }
}

// GET /api/goals
exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(Goal, req.query, ["title", "category", "unit"], "endDate", "endDate", { userId: req.user.id });

    // Auto-sync currentValue from tracked data
    // Skip computation for goals that don't need it to reduce DB queries
    const now = new Date();
    const updates = result.data.map(async (g) => {
      // Skip future goals (not started yet)
      if (g.startDate && new Date(g.startDate) > now) return g;
      // Skip completed goals whose end date has passed
      if (g.completed && g.endDate && new Date(g.endDate) < now) return g;

      const newVal = await computeProgress(g);
      let completed;
      let progress = null; // null means frontend should use default calc

      if (g.category === "weight" && g.targetValue > 0) {
        // Weight goals need direction-aware progress
        // Find baseline weight at goal start
        const baselineQuery = { userId: g.userId };
        if (g.startDate) baselineQuery.date = { $gte: g.startDate };
        const baselineRec = await Weight.findOne(baselineQuery).sort({ date: 1 }).lean();
        const unit = (g.unit || "").toLowerCase().trim();
        let baseVal = newVal; // default: no change if no baseline
        if (baselineRec) {
          if (["kg", "kilograms"].includes(unit)) {
            baseVal = baselineRec.unit === "kg" ? baselineRec.value : Math.round(baselineRec.value / 2.205 * 10) / 10;
          } else {
            baseVal = baselineRec.unit === "lbs" ? baselineRec.value : Math.round(baselineRec.value * 2.205 * 10) / 10;
          }
        }

        if (baseVal > g.targetValue) {
          // Weight LOSS goal
          completed = newVal <= g.targetValue;
          const totalToLose = baseVal - g.targetValue;
          const lost = baseVal - newVal;
          progress = totalToLose > 0 ? Math.max(0, Math.min(Math.round((lost / totalToLose) * 100), 100)) : 0;
        } else if (baseVal < g.targetValue) {
          // Weight GAIN goal
          completed = newVal >= g.targetValue;
          const totalToGain = g.targetValue - baseVal;
          const gained = newVal - baseVal;
          progress = totalToGain > 0 ? Math.max(0, Math.min(Math.round((gained / totalToGain) * 100), 100)) : 0;
        } else {
          completed = true;
          progress = 100;
        }
      } else {
        // Determine if this is a "keep under" goal (vitals with measurement units)
        const gUnit = (g.unit || "").toLowerCase().trim();
        const isKeepUnder =
          (g.category === "blood_glucose" && ["mg/dl", "mgdl", "mg"].includes(gUnit)) ||
          (g.category === "blood_pressure" && ["mmhg", "systolic"].includes(gUnit)) ||
          (g.category === "heart_rate" && ["bpm"].includes(gUnit));

        if (isKeepUnder && g.targetValue > 0) {
          // For "keep under" goals, being at or below target = success
          completed = newVal <= g.targetValue;
          progress = completed ? 100 : (newVal > 0 ? Math.max(0, Math.min(Math.round(((g.targetValue / newVal)) * 100), 99)) : 0);
        } else {
          completed = g.targetValue > 0 && newVal >= g.targetValue;
        }
      }

      if (g.currentValue !== newVal || g.completed !== completed) {
        // Atomic update with optimistic concurrency control
        const updated = await Goal.findOneAndUpdate(
          { _id: g._id, currentValue: g.currentValue, completed: g.completed },
          { currentValue: newVal, completed },
          { new: true }
        );
        if (updated) {
          g.currentValue = newVal;
          g.completed = completed;
        }
        // If update didn't match (concurrent modification), we'll use the stale value
        // and the next request will recalculate with fresh data
      }
      if (progress !== null) g.progress = progress;
      return g;
    });
    result.data = await Promise.all(updates);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/:id
exports.getById = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json(goal);
  } catch (err) {
    next(err);
  }
};

// POST /api/goals
exports.create = async (req, res, next) => {
  try {
    const { category } = req.body;
    // Check if a goal already exists for this category
    const existingGoal = await Goal.findOne({ userId: req.user.id, category });
    if (existingGoal) {
      return res.status(400).json({ error: "A goal already exists for this category. Please edit the existing goal instead." });
    }
    const goal = await Goal.create({ ...req.body, userId: req.user.id });
    res.status(201).json(goal);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// PUT /api/goals/:id
exports.update = async (req, res, next) => {
  try {
    const { userId, ...body } = req.body;
    const goal = await Goal.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, body, {
      new: true,
      runValidators: true,
    });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json(goal);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// DELETE /api/goals/:id
exports.remove = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json({ message: "Goal deleted" });
  } catch (err) {
    next(err);
  }
};
