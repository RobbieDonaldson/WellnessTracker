import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronUp, ChevronDown, CheckCircle2, TrendingUp } from "lucide-react";
import CrudPage from "../components/CrudPage";
import { mealApi } from "../api";
import { RANGES, getDateRange, getPeriodInfo } from "../utils/dateRanges";

// Format date for chart display
function fmt(dateStr) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const columns = [
  { key: "name", label: "Name" },
  { key: "mealType", label: "Meal" },
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
  { key: "cholesterol", label: "Cholesterol (mg)" },
  { key: "sodium", label: "Sodium (mg)" },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleString() },
];

const formFields = [
  { name: "name", label: "Name", required: true },
  { name: "mealType", label: "Meal Type", type: "select", required: true, options: ["breakfast", "lunch", "dinner", "snack"] },
  { name: "calories", label: "Calories", type: "number", required: true, min: 0 },
  { name: "protein", label: "Protein (g)", type: "number", min: 0.00, default: 0 },
  { name: "carbs", label: "Carbs (g)", type: "number", min: 0.00, default: 0 },
  { name: "fat", label: "Fat (g)", type: "number", min: 0.00, default: 0 },
  { name: "cholesterol", label: "Cholesterol (mg)", type: "number", min: 0.00, default: 0 },
  { name: "sodium", label: "Sodium (mg)", type: "number", min: 0.00, default: 0 },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

export default function Meals() {
  // Data state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartCollapsed, setChartCollapsed] = useState(true);
  const [range, setRange] = useState("week");
  const [periodLabel, setPeriodLabel] = useState("This Week");
  
  // Today's value
  const [todayCalories, setTodayCalories] = useState(0);
  
  // Period value
  const [periodAvgCalories, setPeriodAvgCalories] = useState(null);
  const [calorieGoal, setCalorieGoal] = useState(2000); // Default 2000 calories/day

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      const dr = getDateRange(range);
      if (dr.fromDate) params.fromDate = dr.fromDate;
      if (dr.toDate) params.toDate = dr.toDate;
      const r = await mealApi.getAll(params);
      setRows(r.data.data || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    }
    setLoading(false);
  }, [range]);

  useEffect(() => { loadData(); }, [loadData]);

  // Calculate today's calories
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    const total = rows.reduce((sum, r) => {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      if (d.toISOString() === todayStr) {
        return sum + (r.calories || 0);
      }
      return sum;
    }, 0);
    
    setTodayCalories(total);
  }, [rows]);

  // Calculate period average and label
  useEffect(() => {
    const { label, daysInPeriod } = getPeriodInfo(range, rows);
    setPeriodLabel(label);

    if (rows.length > 0) {
      // Group calories by date and calculate daily average
      const caloriesByDate = {};
      rows.forEach(r => {
        const dateKey = new Date(r.date).toDateString();
        caloriesByDate[dateKey] = (caloriesByDate[dateKey] || 0) + (r.calories || 0);
      });
      const dailyCalories = Object.values(caloriesByDate);
      const avgCalories = Math.round(dailyCalories.reduce((s, v) => s + v, 0) / dailyCalories.length);
      setPeriodAvgCalories(avgCalories);
    } else {
      setPeriodAvgCalories(null);
    }
  }, [rows, range]);

  // Calculate chart data (daily calorie totals)
  const chartData = (() => {
    const caloriesByDate = {};
    rows.forEach(r => {
      const dateKey = new Date(r.date).toDateString();
      caloriesByDate[dateKey] = (caloriesByDate[dateKey] || 0) + (r.calories || 0);
    });
    return Object.entries(caloriesByDate).map(([date, calories]) => ({
      date: new Date(date).toLocaleString("en-US", { month: "short", day: "numeric" }),
      calories,
    })).reverse();
  })();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Meals</h1>

      {/* Date Range Pills */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              range === r.key ? "bg-white shadow text-indigo-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Today's Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${todayCalories <= calorieGoal ? "bg-green-100" : "bg-indigo-100"}`}>
              {todayCalories <= calorieGoal ? (
                <CheckCircle2 size={24} className="text-green-600" />
              ) : (
                <TrendingUp size={24} className="text-indigo-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Calories</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayCalories} <span className="text-sm font-normal text-gray-400">/ {calorieGoal} kcal</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Progress</p>
            <p className={`text-lg font-semibold ${todayCalories <= calorieGoal ? "text-green-600" : "text-indigo-600"}`}>
              {Math.min(Math.round((todayCalories / calorieGoal) * 100), 100)}%
            </p>
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${todayCalories <= calorieGoal ? "bg-green-500" : "bg-indigo-500"}`}
            style={{ width: `${Math.min(Math.round((todayCalories / calorieGoal) * 100), 100)}%` }}
          />
        </div>
      </div>

      {/* Collapsible Period Progress */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border mb-4">
          <button
            onClick={() => setChartCollapsed(!chartCollapsed)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
          >
            <h2 className="text-lg font-semibold">{periodLabel}'s Progress</h2>
            <span className="text-gray-400">
              {chartCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </span>
          </button>
          {!chartCollapsed && (
            <div className="px-6 pb-6 space-y-4">
              {/* Period Summary Card */}
              {periodAvgCalories !== null && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${periodAvgCalories <= calorieGoal ? "bg-green-100" : "bg-indigo-100"}`}>
                        {periodAvgCalories <= calorieGoal ? (
                          <CheckCircle2 size={24} className="text-green-600" />
                        ) : (
                          <TrendingUp size={24} className="text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{periodLabel}'s Average Calories</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {periodAvgCalories} <span className="text-sm font-normal text-gray-400">/ {calorieGoal} kcal/day</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div>
                <h3 className="text-sm text-gray-500 mb-4">{periodLabel} Daily Calories Chart</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="calories" fill="#f97316" name="Calories (kcal)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CrudPage title="" api={mealApi} columns={columns} formFields={formFields} range={range} onRangeChange={setRange} />
    </div>
  );
}
