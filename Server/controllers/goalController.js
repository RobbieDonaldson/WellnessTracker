const mongoose = require("mongoose");
const Goal = require("../models/Goal");
const GoalProgress = require("../models/GoalProgress");
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
const { goalProgressCache } = require("../utils/cache");

// Import progress strategies
const ActivityStrategy = require("../strategies/ActivityStrategy");
const NutritionStrategy = require("../strategies/NutritionStrategy");
const SleepStrategy = require("../strategies/SleepStrategy");
const WeightStrategy = require("../strategies/WeightStrategy");
const HydrationStrategy = require("../strategies/HydrationStrategy");
const BloodPressureStrategy = require("../strategies/BloodPressureStrategy");
const BloodGlucoseStrategy = require("../strategies/BloodGlucoseStrategy");
const HeartRateStrategy = require("../strategies/HeartRateStrategy");
const JournalStrategy = require("../strategies/JournalStrategy");
const { unitMatches } = require("../utils/unitNormalizer");

// Strategy factory - returns appropriate strategy for goal category
const models = { Activity, Meal, Sleep, Weight, WaterIntake, BloodPressure, BloodGlucose, HeartRate, Journal };
const strategies = {
  activity: new ActivityStrategy(models),
  nutrition: new NutritionStrategy(models),
  sleep: new SleepStrategy(models),
  weight: new WeightStrategy(models),
  hydration: new HydrationStrategy(models),
  blood_pressure: new BloodPressureStrategy(models),
  blood_glucose: new BloodGlucoseStrategy(models),
  heart_rate: new HeartRateStrategy(models),
  journal: new JournalStrategy(models),
};

function getStrategy(category) {
  return strategies[category];
}

// GET /api/goals
exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(Goal, req.query, ["title", "category", "unit"], "endDate", "endDate", { userId: req.user.id });

    // Auto-sync currentValue from tracked data using strategies
    const now = new Date();
    const goalsNeedingComputation = result.data.filter((g) => {
      // Skip future goals (not started yet)
      if (g.startDate && new Date(g.startDate) > now) return false;
      // Skip completed goals whose end date has passed
      if (g.completed && g.endDate && new Date(g.endDate) < now) return false;
      return true;
    });

    if (goalsNeedingComputation.length === 0) {
      res.json(result);
      return;
    }

    // Compute progress for each goal using its strategy
    // Batch fetch latest weight once for all weight goals
    const userId = req.user.id;
    const weightGoals = goalsNeedingComputation.filter((g) => g.category === "weight");
    let latestWeight = null;
    if (weightGoals.length > 0) {
      latestWeight = await Weight.findOne({ userId }).sort({ date: -1 }).lean();
    }

    const updates = goalsNeedingComputation.map(async (g) => {
      const strategy = getStrategy(g.category);
      if (!strategy) {
        console.warn(`No strategy found for goal category: ${g.category}, goalId: ${g._id}`);
        return g; // Skip goals without strategies
      }

      const cacheKey = `goal:${g.userId}:${g._id}`;
      const cached = goalProgressCache.get(cacheKey);

      let newVal, completed, progress;

      if (cached !== undefined) {
        // Use cached value
        newVal = cached.currentValue;
        completed = cached.completed;
        progress = cached.progress;
      } else {
        // Compute fresh value
        newVal = await strategy.computeCurrentValue(g);
        progress = await strategy.getProgress(g);
        completed = await strategy.isCompleted(g);

        // Cache the computed values
        goalProgressCache.set(cacheKey, { currentValue: newVal, completed, progress });
      }

      // Save progress snapshot (every 6 hours to avoid too many entries)
      try {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const recentSnapshot = await GoalProgress.findOne({ goalId: g._id, userId: g.userId, createdAt: { $gte: sixHoursAgo } });
        if (!recentSnapshot) {
          await GoalProgress.create({
            goalId: g._id,
            userId: g.userId,
            currentValue: newVal,
            completed,
            progressPercentage: progress || 0,
          });
        }
      } catch (err) {
        // Log error but don't fail the entire request
        console.error(`Failed to save progress snapshot for goal ${g._id}:`, err);
      }

      // Update goal document if values changed
      if (g.currentValue !== newVal || g.completed !== completed) {
        const updated = await Goal.findOneAndUpdate(
          { _id: g._id },
          { currentValue: newVal, completed },
          { new: true }
        );
        if (updated) {
          g.currentValue = newVal;
          g.completed = completed;
        }
      }
      // Always set progress on the returned goal object
      if (progress !== null) g.progress = progress;
      return g;
    });

    await Promise.all(updates);
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
    // Also delete progress history
    await GoalProgress.deleteMany({ goalId: req.params.id, userId: req.user.id });
    res.json({ message: "Goal deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/:id/history - Get progress history for a goal
exports.getHistory = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const history = await GoalProgress.find({ goalId: req.params.id, userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100); // Last 100 snapshots

    res.json(history);
  } catch (err) {
    next(err);
  }
};
