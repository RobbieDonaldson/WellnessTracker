const mongoose = require("mongoose");

const goalTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Template title is required"],
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["activity", "nutrition", "sleep", "weight", "hydration", "blood_pressure", "blood_glucose", "heart_rate", "journal"],
    },
    targetValue: {
      type: Number,
      required: [true, "Target value is required"],
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    threshold: {
      type: Number,
      min: 0,
    },
    thresholdUnit: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    suggestedEndDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GoalTemplate", goalTemplateSchema);
