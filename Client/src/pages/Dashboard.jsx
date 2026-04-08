import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { goalApi, bloodPressureApi, bloodGlucoseApi, heartRateApi, weightApi, activityApi, waterIntakeApi } from "../api";
import { HeartPulse, Droplets, Activity, Weight, GlassWater } from "lucide-react";

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const [goals, setGoals] = useState([]);
  const [bp, setBp] = useState([]);
  const [bg, setBg] = useState([]);
  const [hr, setHr] = useState([]);
  const [wt, setWt] = useState([]);
  const [activities, setActivities] = useState([]);
  const [water, setWater] = useState([]);
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
    ]).then(([g, b, bg, h, w, a, wi]) => {
      setGoals(g.data.data);
      setBp(b.data.data.slice().reverse());
      setBg(bg.data.data.slice().reverse());
      setHr(h.data.data.slice().reverse());
      setWt(w.data.data.slice().reverse());
      setActivities(a.data.data.slice().reverse());
      setWater(wi.data.data.slice().reverse());
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-center py-20 text-gray-400">Loading dashboard...</p>;

  const bpData = bp.map((r) => ({ date: fmt(r.date), systolic: r.systolic, diastolic: r.diastolic }));
  const bgData = bg.map((r) => ({ date: fmt(r.date), glucose: r.level }));
  const hrData = hr.map((r) => ({ date: fmt(r.date), bpm: r.bpm }));
  const wtData = wt.map((r) => ({ date: fmt(r.date), weight: r.value }));
  const actData = activities.map((r) => ({ date: fmt(r.date), calories: r.caloriesBurned, duration: r.duration }));
  const waterData = water.map((r) => ({ date: fmt(r.date), amount: r.amount }));
  const avgWater = water.length ? Math.round(water.reduce((s, r) => s + r.amount, 0) / water.length) : "—";

  const goalPie = goals.map((g) => ({
    name: g.title,
    value: Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Blood Pressure" value={`${avg(bp, "systolic")}/${avg(bp, "diastolic")}`} unit="mmHg" color="text-red-600" icon={HeartPulse} />
        <StatCard label="Avg Glucose" value={avg(bg, "level")} unit="mg/dL" color="text-amber-600" icon={Droplets} />
        <StatCard label="Avg Heart Rate" value={avg(hr, "bpm")} unit="bpm" color="text-pink-600" icon={Activity} />
        <StatCard label="Current Weight" value={wt.length ? wt[wt.length - 1].value : "—"} unit="lbs" color="text-indigo-600" icon={Weight} />
        <StatCard label="Avg Water Intake" value={avgWater} unit="oz/day" color="text-cyan-600" icon={GlassWater} />
      </div>

      {/* Goal Progress */}
      <Section title="Goal Progress">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie data={goalPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}%`}>
                  {goalPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {goals.map((g) => {
              const pct = Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100);
              return (
                <div key={g._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{g.title}</span>
                    <span className="text-gray-500">{g.currentValue} / {g.targetValue} {g.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-3 rounded-full ${g.completed ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
    </div>
  );
}

function avg(arr, key) {
  if (!arr.length) return "—";
  return Math.round(arr.reduce((s, r) => s + r[key], 0) / arr.length);
}

function StatCard({ label, value, unit, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
        </p>
      </div>
      {Icon && <Icon size={32} className={`${color} opacity-60`} />}
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
