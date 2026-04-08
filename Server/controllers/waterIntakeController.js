const WaterIntake = require("../models/WaterIntake");
const { paginatedQuery } = require("../utils/queryHelper");

exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(WaterIntake, req.query, ["notes"], "-date");
    res.json(result);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const record = await WaterIntake.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const record = await WaterIntake.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const record = await WaterIntake.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const record = await WaterIntake.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted" });
  } catch (err) { next(err); }
};
