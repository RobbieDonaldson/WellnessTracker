import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronUp, ChevronDown, CheckCircle2, TrendingUp } from "lucide-react";
import CrudPage from "../components/CrudPage";
import { sleepApi } from "../api";
import { RANGES, getDateRange, getPeriodInfo } from "../utils/dateRanges";

// Format date for chart display
function fmt(dateStr) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const columns = [
  { key: "bedtime", label: "Bedtime", render: (r) => new Date(r.bedtime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
  { key: "wakeTime", label: "Wake", render: (r) => new Date(r.wakeTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
  { key: "duration", label: "Hours", render: (r) => r.duration != null ? `${r.duration} hrs` : "—" },
  { key: "quality", label: "Quality" },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleString() },
];

const formFields = [
  { name: "bedtime", label: "Bedtime", type: "datetime-local", required: true },
  { name: "wakeTime", label: "Wake Time", type: "datetime-local", required: true },
  { name: "quality", label: "Quality", type: "select", options: ["poor", "fair", "good", "excellent"], default: "good" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

export default function SleepPage() {
  // Data state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartCollapsed, setChartCollapsed] = useState(true);
  const [range, setRange] = useState("week");
  const [periodLabel, setPeriodLabel] = useState("This Week");
  
  // Today's value
  const [todayDuration, setTodayDuration] = useState(null);
  
  // Period value
  const [periodAvgDuration, setPeriodAvgDuration] = useState(null);
  const [sleepGoal, setSleepGoal] = useState(8); // Default 8 hours

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      const dr = getDateRange(range);
      if (dr.fromDate) params.fromDate = dr.fromDate;
      if (dr.toDate) params.toDate = dr.toDate;
      const r = await sleepApi.getAll(params);
      setRows(r.data.data || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    }
    setLoading(false);
  }, [range]);

  useEffect(() => { loadData(); }, [loadData]);

  // Calculate today's sleep duration
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    const todayEntry = rows.find(r => {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString() === todayStr;
    });
    setTodayDuration(todayEntry ? todayEntry.duration : null);
  }, [rows]);

  // Calculate period average and label
  useEffect(() => {
    const { label, daysInPeriod } = getPeriodInfo(range, rows);
    setPeriodLabel(label);

    if (rows.length > 0) {
      const durations = rows.filter(r => r.duration != null).map(r => r.duration);
      if (durations.length > 0) {
        const avgDuration = (durations.reduce((s, v) => s + v, 0) / durations.length).toFixed(1);
        setPeriodAvgDuration(avgDuration);
      } else {
        setPeriodAvgDuration(null);
      }
    } else {
      setPeriodAvgDuration(null);
    }
  }, [rows, range]);

  // Calculate chart data
  const chartData = rows.filter(r => r.duration != null).map((r) => ({
    date: fmt(r.date),
    duration: r.duration,
  })).reverse();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Sleep</h1>

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
            <div className={`p-3 rounded-lg ${todayDuration !== null && todayDuration >= sleepGoal ? "bg-green-100" : "bg-indigo-100"}`}>
              {todayDuration !== null && todayDuration >= sleepGoal ? (
                <CheckCircle2 size={24} className="text-green-600" />
              ) : (
                <TrendingUp size={24} className="text-indigo-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Sleep</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayDuration !== null ? `${todayDuration} / ${sleepGoal} hrs` : "No data yet"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Progress</p>
            <p className={`text-lg font-semibold ${todayDuration !== null && todayDuration >= sleepGoal ? "text-green-600" : "text-indigo-600"}`}>
              {todayDuration !== null ? `${Math.min(Math.round((todayDuration / sleepGoal) * 100), 100)}%` : "—"}
            </p>
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${todayDuration !== null && todayDuration >= sleepGoal ? "bg-green-500" : "bg-indigo-500"}`}
            style={{ width: `${todayDuration !== null ? Math.min(Math.round((todayDuration / sleepGoal) * 100), 100) : 0}%` }}
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
              {periodAvgDuration !== null && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${periodAvgDuration >= sleepGoal ? "bg-green-100" : "bg-indigo-100"}`}>
                        {periodAvgDuration >= sleepGoal ? (
                          <CheckCircle2 size={24} className="text-green-600" />
                        ) : (
                          <TrendingUp size={24} className="text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{periodLabel}'s Average Sleep</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {periodAvgDuration} <span className="text-sm font-normal text-gray-400">/ {sleepGoal} hrs</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div>
                <h3 className="text-sm text-gray-500 mb-4">{periodLabel} Sleep Duration Chart</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 12]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="duration" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CrudPage title="" api={sleepApi} columns={columns} formFields={formFields} range={range} onRangeChange={setRange} />
    </div>
  );
}
