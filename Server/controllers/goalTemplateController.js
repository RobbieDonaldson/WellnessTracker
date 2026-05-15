const GoalTemplate = require("../models/GoalTemplate");

// GET /api/goal-templates - Get all active templates
exports.getAll = async (req, res, next) => {
  try {
    const templates = await GoalTemplate.find({ isActive: true }).sort({ category: 1, title: 1 });
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

// GET /api/goal-templates/:id - Get a specific template
exports.getById = async (req, res, next) => {
  try {
    const template = await GoalTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (err) {
    next(err);
  }
};

// POST /api/goal-templates - Create a template (admin only in production)
exports.create = async (req, res, next) => {
  try {
    const template = await GoalTemplate.create(req.body);
    res.status(201).json(template);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// PUT /api/goal-templates/:id - Update a template
exports.update = async (req, res, next) => {
  try {
    const template = await GoalTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// DELETE /api/goal-templates/:id - Delete a template
exports.remove = async (req, res, next) => {
  try {
    const template = await GoalTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json({ message: "Template deleted" });
  } catch (err) {
    next(err);
  }
};
