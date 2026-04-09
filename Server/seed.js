require("dotenv").config();
const mongoose = require("mongoose");
const Activity = require("./models/Activity");
const Meal = require("./models/Meal");
const Sleep = require("./models/Sleep");
const Goal = require("./models/Goal");
const BloodPressure = require("./models/BloodPressure");
const BloodGlucose = require("./models/BloodGlucose");
const HeartRate = require("./models/HeartRate");
const Weight = require("./models/Weight");
const User = require("./models/User");
const WaterIntake = require("./models/WaterIntake");
const { estimateCalories } = require("./utils/calorieCalculator");

const SEED_WEIGHT_LBS = 195;
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/WellnessTracker";

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SEED_EMAIL = "john@wellness.com";

async function seed() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB — seeding...");

  // Remove existing john account and its data (leave other users untouched)
  const existing = await User.findOne({ email: SEED_EMAIL });
  if (existing) {
    const uid = existing._id;
    await Promise.all([
      Activity.deleteMany({ userId: uid }),
      Meal.deleteMany({ userId: uid }),
      Sleep.deleteMany({ userId: uid }),
      Goal.deleteMany({ userId: uid }),
      BloodPressure.deleteMany({ userId: uid }),
      BloodGlucose.deleteMany({ userId: uid }),
      HeartRate.deleteMany({ userId: uid }),
      Weight.deleteMany({ userId: uid }),
      WaterIntake.deleteMany({ userId: uid }),
      User.deleteOne({ _id: uid }),
    ]);
    console.log("  Cleared previous seed data for " + SEED_EMAIL);
  }

  // --- Sample User ---
  const john = await User.create({
    email: SEED_EMAIL,
    password: "test1234",
    name: "John Smith",
    age: 34,
    weight: SEED_WEIGHT_LBS,
    weightUnit: "lbs",
    address: { street: "456 Oak Ave", city: "Austin", state: "TX", zip: "78701" },
    role: "user",
    wizardCompleted: true,
  });
  console.log("  1 user: john@wellness.com / test1234");

  // --- Activities (30 days) ---
  const activityTypes = ["running", "walking", "cycling", "swimming", "weightlifting", "yoga", "hiking"];
  const activities = [];
  for (let i = 0; i < 30; i++) {
    const type = activityTypes[rand(0, activityTypes.length - 1)];
    const duration = rand(15, 90);
    activities.push({
      userId: john._id,
      type,
      duration,
      caloriesBurned: estimateCalories(type, duration, SEED_WEIGHT_LBS),
      distance: Math.round(Math.random() * 10 * 100) / 100,
      notes: `Day ${i + 1} workout`,
      date: daysAgo(i),
    });
  }
  await Activity.insertMany(activities);
  console.log(`  ${activities.length} activities`);

  // --- Meals (30 days × 3+ meals) ---
  const mealNames = {
    breakfast: ["Oatmeal with berries", "Scrambled eggs & toast", "Greek yogurt parfait", "Protein smoothie", "Avocado toast"],
    lunch: ["Grilled chicken salad", "Turkey wrap", "Quinoa bowl", "Soup & sandwich", "Poke bowl"],
    dinner: ["Salmon with veggies", "Chicken stir-fry", "Pasta primavera", "Grilled steak & potatoes", "Tacos"],
    snack: ["Apple & peanut butter", "Trail mix", "Protein bar", "Hummus & veggies", "Cottage cheese"],
  };
  const meals = [];
  for (let i = 0; i < 30; i++) {
    for (const mealType of ["breakfast", "lunch", "dinner"]) {
      const names = mealNames[mealType];
      meals.push({
        userId: john._id,
        name: names[rand(0, names.length - 1)],
        mealType,
        calories: rand(200, 800),
        protein: rand(10, 50),
        carbs: rand(20, 80),
        fat: rand(5, 30),
        date: daysAgo(i),
      });
    }
    if (rand(0, 1)) {
      meals.push({
        userId: john._id,
        name: mealNames.snack[rand(0, mealNames.snack.length - 1)],
        mealType: "snack",
        calories: rand(100, 300),
        protein: rand(5, 15),
        carbs: rand(10, 40),
        fat: rand(3, 15),
        date: daysAgo(i),
      });
    }
  }
  await Meal.insertMany(meals);
  console.log(`  ${meals.length} meals`);

  // --- Sleep (30 days) ---
  const qualities = ["poor", "fair", "good", "good", "excellent"];
  const sleepRecords = [];
  for (let i = 0; i < 30; i++) {
    const bedHour = rand(21, 23);
    const sleepHours = rand(5, 9);
    const bedtime = new Date(daysAgo(i));
    bedtime.setHours(bedHour, rand(0, 59), 0, 0);
    const wakeTime = new Date(bedtime);
    wakeTime.setHours(wakeTime.getHours() + sleepHours);
    sleepRecords.push({
      userId: john._id,
      bedtime,
      wakeTime,
      quality: qualities[rand(0, qualities.length - 1)],
      date: daysAgo(i),
    });
  }
  for (const rec of sleepRecords) {
    await new Sleep(rec).save();
  }
  console.log(`  ${sleepRecords.length} sleep records`);

  // --- Goals ---
  const goals = [
    { title: "Run 50 miles this month", category: "activity", targetValue: 50, currentValue: 32, unit: "miles", startDate: daysAgo(30), endDate: daysAgo(-1), userId: john._id },
    { title: "Lose 10 lbs", category: "weight", targetValue: 10, currentValue: 6, unit: "lbs", startDate: daysAgo(60), endDate: daysAgo(-30), userId: john._id },
    { title: "Sleep 8 hours nightly", category: "sleep", targetValue: 240, currentValue: 180, unit: "hours", startDate: daysAgo(30), endDate: daysAgo(-1), userId: john._id },
    { title: "Drink 64 oz water daily", category: "hydration", targetValue: 1920, currentValue: 1400, unit: "oz", startDate: daysAgo(30), endDate: daysAgo(-1), userId: john._id },
    { title: "Eat under 2000 cal/day", category: "nutrition", targetValue: 30, currentValue: 22, unit: "days", startDate: daysAgo(30), endDate: daysAgo(-1), userId: john._id },
    { title: "Maintain fasting glucose < 100", category: "other", targetValue: 100, currentValue: 95, unit: "mg/dL", startDate: daysAgo(30), endDate: daysAgo(-1), completed: true, userId: john._id },
  ];
  await Goal.insertMany(goals);
  console.log(`  ${goals.length} goals`);

  // --- Blood Pressure (30 days) ---
  const bpRecords = [];
  for (let i = 0; i < 30; i++) {
    bpRecords.push({ userId: john._id, systolic: rand(110, 140), diastolic: rand(65, 90), pulse: rand(60, 85), date: daysAgo(i) });
  }
  await BloodPressure.insertMany(bpRecords);
  console.log(`  ${bpRecords.length} blood pressure`);

  // --- Blood Glucose (30 days) ---
  const measurementTypes = ["fasting", "before_meal", "after_meal", "bedtime"];
  const bgRecords = [];
  for (let i = 0; i < 30; i++) {
    bgRecords.push({ userId: john._id, level: rand(70, 130), measurementType: measurementTypes[rand(0, measurementTypes.length - 1)], date: daysAgo(i) });
  }
  await BloodGlucose.insertMany(bgRecords);
  console.log(`  ${bgRecords.length} blood glucose`);

  // --- Heart Rate (30 days) ---
  const contexts = ["resting", "active", "post_exercise", "sleeping"];
  const hrRecords = [];
  for (let i = 0; i < 30; i++) {
    hrRecords.push({ userId: john._id, bpm: rand(55, 110), context: contexts[rand(0, contexts.length - 1)], date: daysAgo(i) });
  }
  await HeartRate.insertMany(hrRecords);
  console.log(`  ${hrRecords.length} heart rate`);

  // --- Weight (30 days, gradual decline) ---
  const weightRecords = [];
  let w = SEED_WEIGHT_LBS;
  for (let i = 29; i >= 0; i--) {
    w -= Math.random() * 0.5;
    weightRecords.push({ userId: john._id, value: Math.round(w * 10) / 10, unit: "lbs", date: daysAgo(i) });
  }
  await Weight.insertMany(weightRecords);
  console.log(`  ${weightRecords.length} weight`);

  // --- Water Intake (30 days) ---
  const waterRecords = [];
  for (let i = 0; i < 30; i++) {
    const glasses = rand(4, 12);
    waterRecords.push({ amount: glasses * 8, unit: "oz", notes: `${glasses} glasses`, date: daysAgo(i), userId: john._id });
  }
  await WaterIntake.insertMany(waterRecords);
  console.log(`  ${waterRecords.length} water intake`);

  console.log("Seed complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
