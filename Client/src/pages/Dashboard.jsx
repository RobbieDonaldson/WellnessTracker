import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { goalApi, bloodPressureApi, bloodGlucoseApi, heartRateApi, weightApi, activityApi, waterIntakeApi, mealApi, journalApi } from "../api";
import { HeartPulse, Droplets, Activity, Weight, GlassWater, Utensils, Smile, Frown, Dumbbell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { convertWeight, convertVolume } from "../utils/unitConversion";
import { getDateRange } from "../utils/dateRanges";

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

const moodScoreMap = {
  Happy: 9, Grateful: 9, Peaceful: 8, Hopeful: 8, Joyful: 10, Content: 8,
  Anxious: 3, Sad: 2, Angry: 2, Lonely: 3, Fearful: 3, Overwhelmed: 2,
  Confused: 4, Frustrated: 3, Guilty: 2, Ashamed: 1, Jealous: 3, Grief: 1,
  Stressed: 3, Tired: 4, Discouraged: 3, Worried: 3, Depressed: 1, Restless: 4,
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function Dashboard() {
  const { user } = useAuth();
  const unitPreference = user?.unitPreference || "standard";
  const [goals, setGoals] = useState([]);
  const [bp, setBp] = useState([]);
  const [bg, setBg] = useState([]);
  const [hr, setHr] = useState([]);
  const [wt, setWt] = useState([]);
  const [activities, setActivities] = useState([]);
  const [water, setWater] = useState([]);
  const [meals, setMeals] = useState([]);
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dr = getDateRange("week");
    const params = { limit: 100 };
    if (dr.fromDate) params.fromDate = dr.fromDate;
    if (dr.toDate) params.toDate = dr.toDate;
    Promise.all([
      goalApi.getAll({ limit: 100 }),
      bloodPressureApi.getAll(params),
      bloodGlucoseApi.getAll(params),
      heartRateApi.getAll(params),
      weightApi.getAll(params),
      activityApi.getAll(params),
      waterIntakeApi.getAll(params),
      mealApi.getAll(params),
      journalApi.getAll(params),
    ])
    .then(([g, b, bg, h, w, a, wi, m, j]) => {
      setGoals(g.data.data || []);
      setBp(b.data.data || []);
      setBg(bg.data.data || []);
      setHr(h.data.data || []);
      setWt(w.data.data || []);
      setActivities(a.data.data || []);
      setWater(wi.data.data || []);
      setMeals(m.data.data || []);
      setJournal(j.data.data || []);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-20 text-gray-400">Loading dashboard...</p>;

  const bpData = bp.map((r) => ({ date: fmt(r.date), systolic: r.systolic, diastolic: r.diastolic }));
  const bgData = bg.map((r) => ({ date: fmt(r.date), glucose: r.level }));
  const hrData = hr.map((r) => ({ date: fmt(r.date), bpm: r.bpm }));
  const wtData = wt.map((r) => ({ date: fmt(r.date), weight: r.value }));
  const actData = activities.map((r) => ({ date: fmt(r.date), calories: r.caloriesBurned, duration: r.duration }));
  const moodData = journal.map((r) => ({ date: fmt(r.date), mood: moodScoreMap[r.mood] || 5 }));
  const waterData = water.map((r) => ({ date: fmt(r.date), amount: r.amount }));
  
  // Convert water to user's preference
  const avgWater = water.length ? Math.round(water.reduce((s, r) => {
    const converted = r.unit === "oz" ? r.amount : convertVolume(r.amount, "ml", "oz");
    return s + converted;
  }, 0) / water.length) : "—";
  
  const avgExerciseMinutes = activities.length ? Math.round(activities.reduce((s, r) => s + (r.duration || 0), 0) / activities.length) : "—";
  
  // Get display units
  const weightUnit = unitPreference === "metric" ? "kg" : "lbs";
  const waterUnit = unitPreference === "metric" ? "ml/day" : "oz/day";
  
  // Convert weight display
  const displayWeight = wt.length ? 
    (() => {
      const lastWt = wt[wt.length - 1];
      if (unitPreference === "metric") {
        if (lastWt.unit === "lbs") return convertWeight(lastWt.value, "lbs", "kg").toFixed(1);
        return lastWt.value;
      } else {
        if (lastWt.unit === "kg") return convertWeight(lastWt.value, "kg", "lbs").toFixed(1);
        return lastWt.value;
      }
    })() : "—";
  
  // Convert water display (avgWater is already in oz)
  const displayWater = avgWater !== "—" ? 
    (() => {
      if (unitPreference === "metric") {
        return Math.round(convertVolume(avgWater, "oz", "ml"));
      } else {
        return avgWater;
      }
    })() : "—";
  
  // Calculate average daily calories from meals
  const mealsByDate = {};
  meals.forEach((m) => {
    const dateKey = new Date(m.date).toDateString();
    mealsByDate[dateKey] = (mealsByDate[dateKey] || 0) + (m.calories || 0);
  });
  const dailyCalories = Object.values(mealsByDate);
  const avgDailyCalories = dailyCalories.length ? Math.round(dailyCalories.reduce((s, v) => s + v, 0) / dailyCalories.length) : "—";
  
  // Calculate average mood from journal (map moods to 1-10 scale)
  const moodScores = journal.map((j) => moodScoreMap[j.mood] || 5);
  const avgMood = moodScores.length ? (moodScores.reduce((s, v) => s + v, 0) / moodScores.length).toFixed(1) : "—";

  const goalPct = (g) => g.progress != null ? g.progress : (g.targetValue > 0 ? Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100) : 0);
  const colors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];
  const goalPie = goals.map((g, idx) => ({
    name: g.title,
    value: Math.max(goalPct(g), 1), // min 1 so Recharts renders a sliver
    actual: goalPct(g),
    fill: colors[idx % colors.length],
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Blood Pressure" value={`${avg(bp, "systolic")}/${avg(bp, "diastolic")}`} unit="mmHg" color="text-red-600" icon={HeartPulse} />
        <StatCard label="Avg Glucose" value={avg(bg, "level")} unit="mg/dL" color="text-amber-600" icon={Droplets} />
        <StatCard label="Avg Heart Rate" value={avg(hr, "bpm")} unit="bpm" color="text-pink-600" icon={Activity} />
        <StatCard label="Current Weight" value={displayWeight} unit={weightUnit} color="text-indigo-600" icon={Weight} />
        <StatCard label="Avg Water Intake" value={displayWater} unit={waterUnit} color="text-cyan-600" icon={GlassWater} />
        <StatCard label="Avg Daily Calories" value={avgDailyCalories} unit="kcal/day" color="text-orange-600" icon={Utensils} />
        <StatCard label="Avg Mood" value={avgMood} unit="/10" color="text-yellow-600" icon={parseFloat(avgMood) < 5 ? Frown : Smile} />
        <StatCard label="Avg Exercise" value={avgExerciseMinutes} unit="min/day" color="text-purple-600" icon={Dumbbell} />
      </div>

      {/* Goal Progress */}
      <Section title="Goal Progress">
        {goals.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No goals yet. Add some goals to track your progress!</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={goalPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {goals.map((g) => {
              const pct = goalPct(g);
              return (
                <div key={g._id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{g.title}</span>
                    <span className="text-gray-500">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div className={`h-2.5 rounded-full ${pct >= 100 ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {g.currentValue || 0} / {g.targetValue} {g.unit || ""}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(g.startDate).toLocaleDateString()} - {new Date(g.endDate).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </Section>

      {/* Weekly Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bpData.length > 0 && (
          <Section title="Blood Pressure">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bpData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="systolic" stroke="#ef4444" dot={false} />
                  <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {hrData.length > 0 && (
          <Section title="Heart Rate">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hrData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="bpm" stroke="#ec4899" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {bgData.length > 0 && (
          <Section title="Blood Glucose">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bgData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="glucose" stroke="#f59e0b" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {wtData.length > 0 && (
          <Section title="Weight">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wtData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#6366f1" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {actData.length > 0 && (
          <Section title="Exercise">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calories" fill="#f59e0b" name="Calories" />
                  <Bar dataKey="duration" fill="#8b5cf6" name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {waterData.length > 0 && (
          <Section title="Water Intake">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#06b6d4" name={`Water (${unitPreference === "metric" ? "ml" : "oz"})`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {moodData.length > 0 && (
          <Section title="Mood Trend">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="#eab308" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function avg(arr, key) {
  if (!arr.length) return "—";
  return Math.round(arr.reduce((s, r) => s + r[key], 0) / arr.length);
}

function StatCard({ label, value, unit, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={`text-xl font-bold ${color}`}>
          {value} <span className="text-xs font-normal text-gray-400">{unit}</span>
        </p>
      </div>
      {Icon && <Icon size={28} className={`${color} opacity-60`} />}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
