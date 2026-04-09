const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      required: [true, "Activity type is required"],
      trim: true,
      enum: ["running", "walking", "cycling", "swimming", "weightlifting", "yoga", "hiking", "other"],
    },
    duration: {
      type: Number,
      required: [true, "Duration in minutes is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    caloriesBurned: {
      type: Number,
      default: 0,
      min: 0,
    },
    distance: {
      type: Number,
      default: null,
      min: 0,
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

module.exports = mongoose.model("Activity", activitySchema);
