const mongoose = require("mongoose");

const bloodGlucoseSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: [true, "Glucose level is required"],
      min: [20, "Level must be at least 20 mg/dL"],
      max: [600, "Level must be at most 600 mg/dL"],
    },
    measurementType: {
      type: String,
      required: [true, "Measurement type is required"],
      enum: ["fasting", "before_meal", "after_meal", "bedtime", "random"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodGlucose", bloodGlucoseSchema);
