const mongoose = require("mongoose");

const goalProgressSchema = new mongoose.Schema(
  {
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Index for querying progress history by goal and date
goalProgressSchema.index({ goalId: 1, createdAt: -1 });
// Compound index for efficient snapshot queries with time filter
goalProgressSchema.index({ goalId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model("GoalProgress", goalProgressSchema);
