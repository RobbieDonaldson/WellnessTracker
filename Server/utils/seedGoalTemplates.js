const GoalTemplate = require("../models/GoalTemplate");

const templates = [
  {
    title: "Exercise 30 minutes daily",
    category: "activity",
    targetValue: 30,
    unit: "minutes",
    suggestedEndDays: 30,
    description: "Get active for 30 minutes every day",
  },
  {
    title: "Walk 10,000 steps daily",
    category: "activity",
    targetValue: 10000,
    unit: "steps",
    suggestedEndDays: 30,
    description: "Walk 10,000 steps each day",
  },
  {
    title: "Run 20 miles per week",
    category: "activity",
    targetValue: 20,
    unit: "miles",
    suggestedEndDays: 30,
    description: "Run a total of 20 miles each week",
  },
  {
    title: "Stay under 2000 calories daily",
    category: "nutrition",
    targetValue: 30,
    unit: "days",
    suggestedEndDays: 30,
    description: "Stay under 2000 calories per day for 30 days",
  },
  {
    title: "Eat 100g protein daily",
    category: "nutrition",
    targetValue: 100,
    unit: "protein",
    suggestedEndDays: 30,
    description: "Consume 100g of protein every day",
  },
  {
    title: "Sleep 8 hours nightly",
    category: "sleep",
    targetValue: 8,
    unit: "hours",
    suggestedEndDays: 30,
    description: "Get 8 hours of sleep each night",
  },
  {
    title: "Lose 10 lbs",
    category: "weight",
    targetValue: 10,
    unit: "lbs",
    suggestedEndDays: 90,
    description: "Lose 10 pounds over the next 90 days",
  },
  {
    title: "Drink 64 oz water daily",
    category: "hydration",
    targetValue: 30,
    unit: "days",
    threshold: 64,
    thresholdUnit: "oz",
    suggestedEndDays: 30,
    description: "Drink at least 64 oz of water daily",
  },
  {
    title: "Keep BP under 130/85",
    category: "blood_pressure",
    targetValue: 30,
    unit: "days",
    suggestedEndDays: 30,
    description: "Maintain blood pressure below 130/85 mmHg",
  },
  {
    title: "Maintain glucose below 100",
    category: "blood_glucose",
    targetValue: 30,
    unit: "days",
    threshold: 100,
    thresholdUnit: "mg/dL",
    suggestedEndDays: 30,
    description: "Keep fasting glucose below 100 mg/dL",
  },
  {
    title: "Maintain resting HR under 75 bpm",
    category: "heart_rate",
    targetValue: 30,
    unit: "days",
    suggestedEndDays: 30,
    description: "Keep resting heart rate under 75 bpm",
  },
  {
    title: "Journal at least 1 time a day",
    category: "journal",
    targetValue: 30,
    unit: "days",
    suggestedEndDays: 30,
    description: "Journal at least once every day",
  },
];

async function seedGoalTemplates() {
  try {
    const count = await GoalTemplate.countDocuments();
    if (count > 0) {
      console.log(`Goal templates already seeded (${count} found). Skipping.`);
      return;
    }

    await GoalTemplate.insertMany(templates);
    console.log(`Seeded ${templates.length} goal templates.`);
  } catch (err) {
    console.error("Error seeding goal templates:", err);
  }
}

module.exports = seedGoalTemplates;
