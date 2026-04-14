require("dotenv").config();
const mongoose = require("mongoose");
const Activity = require("./models/Activity");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/WellnessTracker";

async function migrate() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB — migrating activity distance units...");

  // Find all activities without distanceUnit field (should be none due to default, but checking)
  const activitiesWithoutUnit = await Activity.find({ distanceUnit: { $exists: false } });

  console.log(`Found ${activitiesWithoutUnit.length} activities without distanceUnit`);

  if (activitiesWithoutUnit.length === 0) {
    console.log("No migration needed — all activities have distanceUnit (using default 'mi')");
    await mongoose.disconnect();
    return;
  }

  // Update each activity with default unit "mi"
  const updates = activitiesWithoutUnit.map(async (activity) => {
    await Activity.updateOne(
      { _id: activity._id },
      { $set: { distanceUnit: "mi" } }
    );
    
    console.log(`  Updated activity ${activity._id}: distanceUnit = "mi"`);
  });

  await Promise.all(updates);
  console.log(`Migration complete — updated ${activitiesWithoutUnit.length} activities`);
  
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
