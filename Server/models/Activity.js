const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: {
      type: String,
      required: [true, "Activity name is required"],
      trim: true,
      maxlength: [100, "Name must be 100 characters or less"],
    },
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
    distanceUnit: {
      type: String,
      enum: ["mi", "km"],
      default: "mi",
    },
    reps: {
      type: Number,
      default: null,
      min: [0, "Reps cannot be negative"],
    },
    sets: {
      type: Number,
      default: null,
      min: [0, "Sets cannot be negative"],
    },
    weight: {
      type: Number,
      default: null,
      min: [0, "Weight cannot be negative"],
    },
    steps: {
      type: Number,
      default: null,
      min: [0, "Steps cannot be negative"],
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
