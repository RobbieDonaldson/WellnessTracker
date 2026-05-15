const Journal = require("../models/Journal");
const { paginatedQuery } = require("../utils/queryHelper");
const { getVersesForMood } = require("../utils/bibleVerses");
const { goalProgressCache } = require("../utils/cache");

exports.getAll = async (req, res, next) => {
  try {
    const result = await paginatedQuery(Journal, req.query, ["mood", "title", "content"], "-date", "date", { userId: req.user.id });
    res.json(result);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const record = await Journal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ error: "Journal entry not found" });
    res.json(record);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const record = await Journal.create({ ...req.body, userId: req.user.id });
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
    const record = await Journal.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ error: "Journal entry not found" });
    goalProgressCache.deletePattern(`goal:${req.user.id}:*`);
    res.json(record);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const record = await Journal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!record) return res.status(404).json({ error: "Journal entry not found" });
    goalProgressCache.deletePattern(`goal:${req.user.id}:*`);
    res.json({ message: "Journal entry deleted" });
  } catch (err) { next(err); }
};

// GET /api/journal/verses?mood=Anxious — returns 3 random KJV verses for the mood
exports.getVerses = async (req, res, next) => {
  try {
    const { mood } = req.query;
    if (!mood) return res.status(400).json({ error: "mood query parameter is required." });
    const verses = getVersesForMood(mood);
    if (verses.length === 0) return res.status(400).json({ error: "Unknown mood." });
    res.json({ mood, verses });
  } catch (err) { next(err); }
};
