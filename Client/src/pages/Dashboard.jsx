import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { goalApi, bloodPressureApi, bloodGlucoseApi, heartRateApi, weightApi, activityApi, waterIntakeApi, mealApi, journalApi } from "../api";
import { HeartPulse, Droplets, Activity, Weight, GlassWater, Utensils, Smile, Frown, Dumbbell } from "lucide-react";

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
    const all = { limit: 100 };
    Promise.all([
      goalApi.getAll(all),
      bloodPressureApi.getAll(all),
      bloodGlucoseApi.getAll(all),
      heartRateApi.getAll(all),
      weightApi.getAll(all),
      activityApi.getAll(all),
      waterIntakeApi.getAll(all),
      mealApi.getAll(all),
      journalApi.getAll(all),
    ]).then(([g, b, bg, h, w, a, wi, m, j]) => {
      setGoals(g.data.data);
      setBp(b.data.data.slice().reverse());
      setBg(bg.data.data.slice().reverse());
      setHr(h.data.data.slice().reverse());
      setWt(w.data.data.slice().reverse());
      setActivities(a.data.data.slice().reverse());
      setWater(wi.data.data.slice().reverse());
      setMeals(m.data.data.slice().reverse());
      setJournal(j.data.data.slice().reverse());
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-center py-20 text-gray-400">Loading dashboard...</p>;

  const bpData = bp.map((r) => ({ date: fmt(r.date), systolic: r.systolic, diastolic: r.diastolic }));
  const bgData = bg.map((r) => ({ date: fmt(r.date), glucose: r.level }));
  const hrData = hr.map((r) => ({ date: fmt(r.date), bpm: r.bpm }));
  const wtData = wt.map((r) => ({ date: fmt(r.date), weight: r.value }));
  const actData = activities.map((r) => ({ date: fmt(r.date), calories: r.caloriesBurned, duration: r.duration }));
  const moodData = journal.map((r) => ({ date: fmt(r.date), mood: moodScoreMap[r.mood] || 5 }));
  const waterData = water.map((r) => ({ date: fmt(r.date), amount: r.amount }));
  const avgWater = water.length ? Math.round(water.reduce((s, r) => s + r.amount, 0) / water.length) : "—";
  const avgExerciseMinutes = activities.length ? Math.round(activities.reduce((s, r) => s + (r.duration || 0), 0) / activities.length) : "—";
  
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
  const goalPie = goals.map((g) => ({
    name: g.title,
    value: Math.max(goalPct(g), 1), // min 1 so Recharts renders a sliver
    actual: goalPct(g),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Blood Pressure" value={`${avg(bp, "systolic")}/${avg(bp, "diastolic")}`} unit="mmHg" color="text-red-600" icon={HeartPulse} />
        <StatCard label="Avg Glucose" value={avg(bg, "level")} unit="mg/dL" color="text-amber-600" icon={Droplets} />
        <StatCard label="Avg Heart Rate" value={avg(hr, "bpm")} unit="bpm" color="text-pink-600" icon={Activity} />
        <StatCard label="Current Weight" value={wt.length ? wt[wt.length - 1].value : "—"} unit="lbs" color="text-indigo-600" icon={Weight} />
        <StatCard label="Avg Water Intake" value={avgWater} unit="oz/day" color="text-cyan-600" icon={GlassWater} />
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
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie data={goalPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ actual }) => `${actual}%`}>
                  {goalPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name, entry) => `${entry.payload.actual}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {goals.map((g) => {
              const pct = goalPct(g);
              return (
                <div key={g._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{g.title}</span>
                    <span className="text-gray-500">{g.currentValue} / {g.targetValue} {g.unit} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-3 rounded-full ${g.completed ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </Section>

      {/* Blood Pressure */}
      <Section title="Blood Pressure (30 Days)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bpData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[50, 160]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Blood Glucose */}
      <Section title="Blood Glucose (30 Days)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bgData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[60, 150]} />
              <Tooltip />
              <Line type="monotone" dataKey="glucose" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Heart Rate */}
      <Section title="Heart Rate (30 Days)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hrData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[40, 130]} />
              <Tooltip />
              <Line type="monotone" dataKey="bpm" stroke="#ec4899" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Weight Trend */}
      <Section title="Weight Trend (30 Days)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wtData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Activity */}
      <Section title="Activity (30 Days)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={actData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="calories" fill="#6366f1" name="Calories Burned" />
              <Bar yAxisId="right" dataKey="duration" fill="#06b6d4" name="Duration (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Water Intake */}
      <Section title="Water Intake (30 Days)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#06b6d4" name="Water (oz)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Mood Trend */}
      <Section title="Mood Trend (30 Days)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="mood" stroke="#eab308" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>
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
