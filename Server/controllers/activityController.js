const Activity = require("../models/Activity");
const Weight = require("../models/Weight");
const { estimateCalories } = require("../utils/calorieCalculator");
const { paginatedQuery } = require("../utils/queryHelper");

const DEFAULT_WEIGHT_LBS = 170;

async function getLatestWeight() {
  const latest = await Weight.findOne().sort({ date: -1 }).lean();
  if (!latest) return DEFAULT_WEIGHT_LBS;
  return latest.unit === "kg" ? latest.value * 2.205 : latest.value;
}

// GET /api/activities
exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(Activity, req.query, ["type", "notes"], "-date");
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/activities/:id
exports.getById = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Activity not found" });
    res.json(activity);
  } catch (err) {
    next(err);
  }
};

// POST /api/activities/estimate — preview calorie calculation
exports.estimate = async (req, res, next) => {
  try {
    const { type, duration } = req.body;
    if (!type || !duration) return res.status(400).json({ error: "type and duration are required" });
    const weightLbs = await getLatestWeight();
    const caloriesBurned = estimateCalories(type, duration, weightLbs);
    res.json({ caloriesBurned, weightUsedLbs: Math.round(weightLbs), met: require("../utils/calorieCalculator").MET_VALUES[type] || 5.0 });
  } catch (err) { next(err); }
};

// POST /api/activities
exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (!data.manualCalories) {
      const weightLbs = await getLatestWeight();
      data.caloriesBurned = estimateCalories(data.type, data.duration, weightLbs);
    }
    delete data.manualCalories;
    const activity = await Activity.create(data);
    res.status(201).json(activity);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// PUT /api/activities/:id
exports.update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (!data.manualCalories && data.type && data.duration) {
      const weightLbs = await getLatestWeight();
      data.caloriesBurned = estimateCalories(data.type, data.duration, weightLbs);
    }
    delete data.manualCalories;
    const activity = await Activity.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!activity) return res.status(404).json({ error: "Activity not found" });
    res.json(activity);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// DELETE /api/activities/:id
exports.remove = async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ error: "Activity not found" });
    res.json({ message: "Activity deleted" });
  } catch (err) {
    next(err);
  }
};
