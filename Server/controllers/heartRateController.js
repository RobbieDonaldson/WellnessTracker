const HeartRate = require("../models/HeartRate");
const { paginatedQuery } = require("../utils/queryHelper");

exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(HeartRate, req.query, ["context"], "-date", "date", { userId: req.user.id });
    res.json(result);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const record = await HeartRate.findOne({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const record = await HeartRate.create({ ...req.body, userId: req.user.id });
    res.status(201).json(record);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { userId, ...body } = req.body;
    const record = await HeartRate.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const record = await HeartRate.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted" });
  } catch (err) { next(err); }
};
