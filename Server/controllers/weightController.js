const Weight = require("../models/Weight");
const { paginatedQuery } = require("../utils/queryHelper");
const { goalProgressCache } = require("../utils/cache");

exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(Weight, req.query, ["unit"], "-date", "date", { userId: req.user.id });
    res.json(result);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const record = await Weight.findOne({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const record = await Weight.create({ ...req.body, userId: req.user.id });
    goalProgressCache.deletePattern(`goal:${req.user.id}:*`);
    res.status(201).json(record);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { userId, ...body } = req.body;
    const record = await Weight.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ error: "Record not found" });
    goalProgressCache.deletePattern(`goal:${req.user.id}:*`);
    res.json(record);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const record = await Weight.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ error: "Record not found" });
    goalProgressCache.deletePattern(`goal:${req.user.id}:*`);
    res.json({ message: "Record deleted" });
  } catch (err) { next(err); }
};
