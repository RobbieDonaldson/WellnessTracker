const Meal = require("../models/Meal");
const { paginatedQuery } = require("../utils/queryHelper");

// GET /api/meals
exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(Meal, req.query, ["name", "mealType"], "-date");
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/meals/:id
exports.getById = async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ error: "Meal not found" });
    res.json(meal);
  } catch (err) {
    next(err);
  }
};

// POST /api/meals
exports.create = async (req, res, next) => {
  try {
    const meal = await Meal.create(req.body);
    res.status(201).json(meal);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// PUT /api/meals/:id
exports.update = async (req, res, next) => {
  try {
    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!meal) return res.status(404).json({ error: "Meal not found" });
    res.json(meal);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// DELETE /api/meals/:id
exports.remove = async (req, res, next) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) return res.status(404).json({ error: "Meal not found" });
    res.json({ message: "Meal deleted" });
  } catch (err) {
    next(err);
  }
};
