/**
 * One-time script: Wipe all data belonging to redjr0873@gmail.com
 * and reset their wizardCompleted so they must redo the goal wizard.
 *
 * Usage:  node cleanup-user.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Goal = require("./models/Goal");
const WaterIntake = require("./models/WaterIntake");

const TARGET_EMAIL = "redjr0873@gmail.com";
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/WellnessTracker";

async function cleanup() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.log(`User ${TARGET_EMAIL} not found — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  console.log(`Found user: ${user.name} (${user._id})`);

  // Delete user-scoped data
  const goalResult = await Goal.deleteMany({ userId: user._id });
  console.log(`  Deleted ${goalResult.deletedCount} goals`);

  const waterResult = await WaterIntake.deleteMany({ userId: user._id });
  console.log(`  Deleted ${waterResult.deletedCount} water intake records`);

  // Reset wizardCompleted so user must redo wizard on next login
  await User.findByIdAndUpdate(user._id, { wizardCompleted: false });
  console.log(`  Reset wizardCompleted to false`);

  console.log("Cleanup complete!");
  await mongoose.disconnect();
}

cleanup().catch((err) => {
  console.error(err);
  process.exit(1);
});
