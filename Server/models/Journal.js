const mongoose = require("mongoose");

const MOODS = [
  "Happy", "Grateful", "Peaceful", "Hopeful", "Joyful", "Content",
  "Anxious", "Sad", "Angry", "Lonely", "Fearful", "Overwhelmed",
  "Confused", "Frustrated", "Guilty", "Ashamed", "Jealous", "Grief",
  "Stressed", "Tired", "Discouraged", "Worried", "Depressed", "Restless",
];

const journalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mood: {
      type: String,
      required: [true, "Mood is required"],
      enum: MOODS,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [50, "Title must be 50 characters or less"],
    },
    content: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Journal", journalSchema);
module.exports.MOODS = MOODS;
