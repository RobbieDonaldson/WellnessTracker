const mongoose = require("mongoose");

const sleepSchema = new mongoose.Schema(
  {
    bedtime: {
      type: Date,
      required: [true, "Bedtime is required"],
    },
    wakeTime: {
      type: Date,
      required: [true, "Wake time is required"],
    },
    duration: {
      type: Number,
      min: 0,
    },
    quality: {
      type: String,
      enum: ["poor", "fair", "good", "excellent"],
      default: "good",
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

// Calculate duration in hours before saving
sleepSchema.pre("save", function (next) {
  if (this.bedtime && this.wakeTime) {
    const ms = this.wakeTime.getTime() - this.bedtime.getTime();
    this.duration = Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
  }
  next();
});

module.exports = mongoose.model("Sleep", sleepSchema);
