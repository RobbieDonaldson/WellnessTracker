const mongoose = require("mongoose");

const bloodPressureSchema = new mongoose.Schema(
  {
    systolic: {
      type: Number,
      required: [true, "Systolic value is required"],
      min: [50, "Systolic must be at least 50"],
      max: [300, "Systolic must be at most 300"],
    },
    diastolic: {
      type: Number,
      required: [true, "Diastolic value is required"],
      min: [30, "Diastolic must be at least 30"],
      max: [200, "Diastolic must be at most 200"],
    },
    pulse: {
      type: Number,
      min: 20,
      max: 250,
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

module.exports = mongoose.model("BloodPressure", bloodPressureSchema);
