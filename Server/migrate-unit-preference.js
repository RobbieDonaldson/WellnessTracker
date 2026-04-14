require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Weight = require("./models/Weight");
const WaterIntake = require("./models/WaterIntake");
const Activity = require("./models/Activity");
const Goal = require("./models/Goal");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/WellnessTracker";

// Conversion factors (must match frontend)
const LBS_TO_KG = 0.45359237;
const KG_TO_LBS = 2.20462;
const OZ_TO_ML = 29.5735;
const ML_TO_OZ = 0.033814;
const MI_TO_KM = 1.609344;
const KM_TO_MI = 0.621371;

async function migrate() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB — migrating unit preference data...");

  // Get all users
  const users = await User.find({ unitPreference: { $exists: true } });
  console.log(`Found ${users.length} users with unit preference`);

  for (const user of users) {
    const { _id, unitPreference } = user;
    console.log(`\nProcessing user ${_id} (${unitPreference === "metric" ? "metric" : "standard"})`);

    if (unitPreference === "metric") {
      // Convert from standard to metric
      await convertToMetric(_id);
    } else {
      // Convert from metric to standard
      await convertToStandard(_id);
    }
  }

  console.log("\nMigration complete");
  await mongoose.disconnect();
}

async function convertToMetric(userId) {
  // Convert Weight: lbs to kg
  const weights = await Weight.find({ userId });
  console.log(`  Converting ${weights.length} weight records to metric`);
  for (const weight of weights) {
    if (weight.unit === "lbs") {
      await Weight.updateOne(
        { _id: weight._id },
        { $set: { value: weight.value * LBS_TO_KG, unit: "kg" } }
      );
    }
  }

  // Convert Water Intake: oz to ml
  const waterIntakes = await WaterIntake.find({ userId });
  console.log(`  Converting ${waterIntakes.length} water intake records to metric`);
  for (const intake of waterIntakes) {
    if (intake.unit === "oz") {
      await WaterIntake.updateOne(
        { _id: intake._id },
        { $set: { amount: Math.round(intake.amount * OZ_TO_ML), unit: "ml" } }
      );
    }
  }

  // Convert Activities: distance mi to km, weight lbs to kg
  const activities = await Activity.find({ userId });
  console.log(`  Converting ${activities.length} activity records to metric`);
  for (const activity of activities) {
    const updates = {};
    if (activity.distanceUnit === "mi") {
      updates.distance = activity.distance * MI_TO_KM;
      updates.distanceUnit = "km";
    }
    if (activity.weight) {
      updates.weight = activity.weight * LBS_TO_KG;
    }
    if (Object.keys(updates).length > 0) {
      await Activity.updateOne({ _id: activity._id }, { $set: updates });
    }
  }

  // Convert Goals: lbs to kg, oz to ml, mi to km
  const goals = await Goal.find({ userId });
  console.log(`  Converting ${goals.length} goal records to metric`);
  for (const goal of goals) {
    const updates = {};
    if (goal.unit === "lbs") {
      updates.targetValue = goal.targetValue * LBS_TO_KG;
      updates.currentValue = goal.currentValue ? goal.currentValue * LBS_TO_KG : goal.currentValue;
      updates.unit = "kg";
    } else if (goal.unit === "oz") {
      updates.targetValue = goal.targetValue * OZ_TO_ML;
      updates.currentValue = goal.currentValue ? goal.currentValue * OZ_TO_ML : goal.currentValue;
      updates.unit = "ml";
    } else if (goal.unit === "mi") {
      updates.targetValue = goal.targetValue * MI_TO_KM;
      updates.currentValue = goal.currentValue ? goal.currentValue * MI_TO_KM : goal.currentValue;
      updates.unit = "km";
    }
    if (Object.keys(updates).length > 0) {
      await Goal.updateOne({ _id: goal._id }, { $set: updates });
    }
  }
}

async function convertToStandard(userId) {
  // Convert Weight: kg to lbs
  const weights = await Weight.find({ userId });
  console.log(`  Converting ${weights.length} weight records to standard`);
  for (const weight of weights) {
    if (weight.unit === "kg") {
      await Weight.updateOne(
        { _id: weight._id },
        { $set: { value: weight.value * KG_TO_LBS, unit: "lbs" } }
      );
    }
  }

  // Convert Water Intake: ml to oz
  const waterIntakes = await WaterIntake.find({ userId });
  console.log(`  Converting ${waterIntakes.length} water intake records to standard`);
  for (const intake of waterIntakes) {
    if (intake.unit === "ml") {
      await WaterIntake.updateOne(
        { _id: intake._id },
        { $set: { amount: Math.round(intake.amount * ML_TO_OZ), unit: "oz" } }
      );
    }
  }

  // Convert Activities: distance km to mi, weight kg to lbs
  const activities = await Activity.find({ userId });
  console.log(`  Converting ${activities.length} activity records to standard`);
  for (const activity of activities) {
    const updates = {};
    if (activity.distanceUnit === "km") {
      updates.distance = activity.distance * KM_TO_MI;
      updates.distanceUnit = "mi";
    }
    if (activity.weight) {
      updates.weight = activity.weight * KG_TO_LBS;
    }
    if (Object.keys(updates).length > 0) {
      await Activity.updateOne({ _id: activity._id }, { $set: updates });
    }
  }

  // Convert Goals: kg to lbs, ml to oz, km to mi
  const goals = await Goal.find({ userId });
  console.log(`  Converting ${goals.length} goal records to standard`);
  for (const goal of goals) {
    const updates = {};
    if (goal.unit === "kg") {
      updates.targetValue = goal.targetValue * KG_TO_LBS;
      updates.currentValue = goal.currentValue ? goal.currentValue * KG_TO_LBS : goal.currentValue;
      updates.unit = "lbs";
    } else if (goal.unit === "ml") {
      updates.targetValue = goal.targetValue * ML_TO_OZ;
      updates.currentValue = goal.currentValue ? goal.currentValue * ML_TO_OZ : goal.currentValue;
      updates.unit = "oz";
    } else if (goal.unit === "km") {
      updates.targetValue = goal.targetValue * KM_TO_MI;
      updates.currentValue = goal.currentValue ? goal.currentValue * KM_TO_MI : goal.currentValue;
      updates.unit = "mi";
    }
    if (Object.keys(updates).length > 0) {
      await Goal.updateOne({ _id: goal._id }, { $set: updates });
    }
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
