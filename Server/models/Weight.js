const mongoose = require("mongoose");

const weightSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: [true, "Weight value is required"],
      min: [50, "Weight must be at least 50 lbs"],
      max: [800, "Weight must be at most 800 lbs"],
    },
    unit: {
      type: String,
      enum: ["lbs", "kg"],
      default: "lbs",
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

module.exports = mongoose.model("Weight", weightSchema);
