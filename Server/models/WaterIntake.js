const mongoose = require("mongoose");

const waterIntakeSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1 oz"],
      max: [500, "Amount must be at most 500 oz"],
    },
    unit: {
      type: String,
      enum: ["oz", "ml"],
      default: "oz",
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WaterIntake", waterIntakeSchema);
