const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: {
      type: String,
      required: [true, "Meal name is required"],
      trim: true,
      maxlength: 200,
    },
    mealType: {
      type: String,
      required: [true, "Meal type is required"],
      enum: ["breakfast", "lunch", "dinner", "snack"],
    },
    calories: {
      type: Number,
      required: [true, "Calories are required"],
      min: [0, "Calories cannot be negative"],
    },
    protein: { type: Number, default: 0, min: 0.00 },
    carbs: { type: Number, default: 0, min: 0.00 },
    fat: { type: Number, default: 0, min: 0.00 },
    cholesterol: { type: Number, default: 0, min: 0.00 },
    sodium: { type: Number, default: 0, min: 0.00},
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

module.exports = mongoose.model("Meal", mealSchema);
