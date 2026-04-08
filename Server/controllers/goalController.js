const Goal = require("../models/Goal");
const { paginatedQuery } = require("../utils/queryHelper");

// GET /api/goals
exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(Goal, req.query, ["title", "category", "unit"], "endDate", "endDate");
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/:id
exports.getById = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json(goal);
  } catch (err) {
    next(err);
  }
};

// POST /api/goals
exports.create = async (req, res, next) => {
  try {
    const goal = await Goal.create(req.body);
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
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
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
    const goal = await Goal.findByIdAndDelete(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json({ message: "Goal deleted" });
  } catch (err) {
    next(err);
  }
};
