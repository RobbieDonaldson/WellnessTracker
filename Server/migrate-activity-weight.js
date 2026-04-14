require("dotenv").config();
const mongoose = require("mongoose");
const Activity = require("./models/Activity");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/WellnessTracker";

async function migrate() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB — migrating weightlifting activities...");

  // Find all weightlifting activities without a weight field
  const weightliftingActivities = await Activity.find({ 
    type: "weightlifting",
    weight: { $exists: false }
  });

  console.log(`Found ${weightliftingActivities.length} weightlifting activities without weight field`);

  if (weightliftingActivities.length === 0) {
    console.log("No migration needed — all weightlifting activities have weight field");
    await mongoose.disconnect();
    return;
  }

  // Update each weightlifting activity to add weight field (set to null)
  const updates = weightliftingActivities.map(async (activity) => {
    await Activity.updateOne(
      { _id: activity._id },
      { $set: { weight: null } }
    );
    
    console.log(`  Updated activity ${activity._id}: added weight field`);
  });

  await Promise.all(updates);
  console.log(`Migration complete — updated ${weightliftingActivities.length} weightlifting activities`);
  
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
