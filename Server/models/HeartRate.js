const mongoose = require("mongoose");

const heartRateSchema = new mongoose.Schema(
  {
    bpm: {
      type: Number,
      required: [true, "BPM is required"],
      min: [20, "BPM must be at least 20"],
      max: [250, "BPM must be at most 250"],
    },
    context: {
      type: String,
      enum: ["resting", "active", "post_exercise", "sleeping"],
      default: "resting",
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

module.exports = mongoose.model("HeartRate", heartRateSchema);
