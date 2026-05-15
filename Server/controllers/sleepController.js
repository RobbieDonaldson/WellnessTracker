const Sleep = require("../models/Sleep");
const { paginatedQuery } = require("../utils/queryHelper");
const { goalProgressCache } = require("../utils/cache");

// GET /api/sleep
exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(Sleep, req.query, ["quality"], "-date", "date", { userId: req.user.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/sleep/:id
exports.getById = async (req, res, next) => {
  try {
    const record = await Sleep.findOne({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ error: "Sleep record not found" });
    res.json(record);
  } catch (err) {
    next(err);
  }
};

// POST /api/sleep
exports.create = async (req, res, next) => {
  try {
    const record = new Sleep({ ...req.body, userId: req.user.id });
    await record.save();
    goalProgressCache.deletePattern(`goal:${req.user.id}:*`);
    res.status(201).json(record);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// PUT /api/sleep/:id
exports.update = async (req, res, next) => {
  try {
    const record = await Sleep.findOne({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ error: "Sleep record not found" });

    const { userId, ...body } = req.body;
    Object.assign(record, body);
    await record.save();
    goalProgressCache.deletePattern(`goal:${req.user.id}:*`);
    res.json(record);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// DELETE /api/sleep/:id
exports.remove = async (req, res, next) => {
  try {
    const record = await Sleep.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ error: "Sleep record not found" });
    goalProgressCache.deletePattern(`goal:${req.user.id}:*`);
    res.json({ message: "Sleep record deleted" });
  } catch (err) {
    next(err);
  }
};
