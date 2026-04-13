require("dotenv").config();
const mongoose = require("mongoose");
const Activity = require("./models/Activity");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/WellnessTracker";

async function migrate() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB — migrating activities...");

  // Find all activities without a name or with empty name
  const activitiesWithoutName = await Activity.find({ 
    $or: [
      { name: { $exists: false } },
      { name: null },
      { name: "" }
    ]
  });

  console.log(`Found ${activitiesWithoutName.length} activities without names`);

  if (activitiesWithoutName.length === 0) {
    console.log("No migration needed — all activities have names");
    await mongoose.disconnect();
    return;
  }

  // Update each activity with a default name based on type
  const updates = activitiesWithoutName.map(async (activity) => {
    const defaultNames = {
      running: "Running Session",
      walking: "Walking Session",
      cycling: "Cycling Session",
      swimming: "Swimming Session",
      weightlifting: "Weightlifting Session",
      yoga: "Yoga Session",
      hiking: "Hiking Session",
      other: "Activity Session"
    };
    
    const defaultName = defaultNames[activity.type] || "Activity Session";
    
    await Activity.updateOne(
      { _id: activity._id },
      { $set: { name: defaultName } }
    );
    
    console.log(`  Updated activity ${activity._id}: "${defaultName}"`);
  });

  await Promise.all(updates);
  console.log(`Migration complete — updated ${activitiesWithoutName.length} activities`);
  
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
