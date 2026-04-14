import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronUp, ChevronDown, CheckCircle2, TrendingUp } from "lucide-react";
import CrudPage from "../components/CrudPage";
import { bloodPressureApi, bloodGlucoseApi, heartRateApi, weightApi, goalApi } from "../api";
import { RANGES, getDateRange, getPeriodInfo } from "../utils/dateRanges";
import { useAuth } from "../context/AuthContext";
import { convertWeight, getWeightUnit } from "../utils/unitConversion";

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Format date for chart display
function fmt(dateStr) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const tabs = [
  { key: "bp", label: "Blood Pressure" },
  { key: "bg", label: "Blood Glucose" },
  { key: "hr", label: "Heart Rate" },
  { key: "wt", label: "Weight" },
];

const bpColumns = [
  { key: "systolic", label: "Systolic" },
  { key: "diastolic", label: "Diastolic" },
  { key: "pulse", label: "Pulse", render: (r) => r.pulse ?? "—" },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleString() },
];
const bpFields = [
  { name: "systolic", label: "Systolic (mmHg)", type: "number", required: true, min: 50, max: 300 },
  { name: "diastolic", label: "Diastolic (mmHg)", type: "number", required: true, min: 30, max: 200 },
  { name: "pulse", label: "Pulse (bpm)", type: "number", min: 20, max: 250 },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

const bgColumns = [
  { key: "level", label: "Glucose (mg/dL)" },
  { key: "measurementType", label: "Measurement" },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleString() },
];
const bgFields = [
  { name: "level", label: "Glucose Level (mg/dL)", type: "number", required: true, min: 20, max: 600 },
  { name: "measurementType", label: "Measurement Type", type: "select", required: true, options: ["fasting", "before_meal", "after_meal", "bedtime", "random"] },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

const hrColumns = [
  { key: "bpm", label: "BPM" },
  { key: "context", label: "Context" },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleString() },
];
const hrFields = [
  { name: "bpm", label: "Heart Rate (bpm)", type: "number", required: true, min: 20, max: 250 },
  { name: "context", label: "Context", type: "select", options: ["resting", "active", "post_exercise", "sleeping"], default: "resting" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

const wtColumns = [
  { key: "value", label: "Weight", render: (r) => `${r.value} ${r.unit}` },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleString() },
];
const wtFields = [
  { name: "value", label: "Weight", type: "number", required: true, step: "0.1", min: 50, max: 800 },
  { name: "unit", label: "Unit", type: "select", options: ["lbs", "kg"], default: "lbs" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

// Dynamic weight columns and fields based on user preference
const getWeightColumns = (unitPreference) => [
  { 
    key: "value", 
    label: "Weight", 
    render: (r) => {
      return `${r.value} ${r.unit || ""}`;
    }
  },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleString() },
];
const getWeightFields = (unitPreference) => {
  const isMetric = unitPreference === "metric";
  return [
    { 
      name: "value", 
      label: `Weight (${isMetric ? "kg" : "lbs"})`, 
      type: "number", 
      required: true, 
      step: "0.1", 
      min: isMetric ? 22.7 : 50, // ~50 lbs = 22.7 kg
      max: isMetric ? 362.9 : 800 // ~800 lbs = 362.9 kg
    },
    { 
      name: "unit", 
      label: "Unit", 
      type: "select", 
      options: [isMetric ? "kg" : "lbs"], 
      default: isMetric ? "kg" : "lbs", 
      readOnly: true 
    },
    { name: "notes", label: "Notes", type: "textarea" },
    { name: "date", label: "Date", type: "date" },
  ];
};

export default function Vitals() {
  const { user } = useAuth();
  const [tab, setTab] = useState("bp");
  const unitPreference = user?.unitPreference || "standard";
  
  // Transform function for weight (memoized)
  const transformWeightRow = useCallback((row) => {
    const targetUnit = unitPreference === "metric" ? "kg" : "lbs";
    if (row.unit !== targetUnit) {
      return {
        ...row,
        value: Number(convertWeight(row.value, row.unit, targetUnit).toFixed(1)),
        unit: targetUnit,
      };
    }
    return row;
  }, [unitPreference]);

  const weightTransformSave = useCallback((payload) => {
    if (unitPreference === "metric" && payload.value) {
      return {
        ...payload,
        value: convertWeight(Number(payload.value), "kg", "lbs"),
        unit: "lbs",
      };
    }
    return payload;
  }, [unitPreference]);

  // Dynamic config based on unit preference (memoized to prevent recreation)
  const config = useMemo(() => ({
    bp: { title: "Blood Pressure", api: bloodPressureApi, columns: bpColumns, formFields: bpFields },
    bg: { title: "Blood Glucose", api: bloodGlucoseApi, columns: bgColumns, formFields: bgFields },
    hr: { title: "Heart Rate", api: heartRateApi, columns: hrColumns, formFields: hrFields },
    wt: { 
      title: "Weight", 
      api: weightApi, 
      columns: getWeightColumns(unitPreference), 
      formFields: getWeightFields(unitPreference),
      transformRow: transformWeightRow,
      transformSave: weightTransformSave
    },
  }), [unitPreference, transformWeightRow, weightTransformSave]);
  const c = useMemo(() => ({ ...config[tab], columns: tab === "wt" ? getWeightColumns(unitPreference) : config[tab].columns }), [config, tab, unitPreference]);

  // Wrapped API for CrudPage (memoized to prevent CrudPage re-fetching on every parent re-render)
  const wrappedApi = useMemo(() => ({
    ...c.api,
    create: async (data) => {
      if (tab === "wt" && c.transformSave) {
        data = c.transformSave(data);
      }
      return await c.api.create(data);
    },
    update: async (id, data) => {
      if (tab === "wt" && c.transformSave) {
        data = c.transformSave(data);
      }
      return await c.api.update(id, data);
    },
  }), [c.api, c.transformSave, tab]);
  
  // Data state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartCollapsed, setChartCollapsed] = useState(true);
  const [range, setRange] = useState("week");
  const [periodLabel, setPeriodLabel] = useState("This Week");
  
  // Today's values
  const [todayBp, setTodayBp] = useState(null);
  const [todayBg, setTodayBg] = useState(null);
  const [todayHr, setTodayHr] = useState(null);
  const [todayWt, setTodayWt] = useState(null);
  
  // Period values
  const [periodAvg, setPeriodAvg] = useState(null);
  
  // Goals
  const [bpGoal, setBpGoal] = useState(120);
  const [bgGoal, setBgGoal] = useState(100);
  const [hrGoal, setHrGoal] = useState(72);
  const [wtGoal, setWtGoal] = useState(150);

  // Load data based on current tab (with debouncing)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      const dr = getDateRange(range);
      if (dr.fromDate) params.fromDate = dr.fromDate;
      if (dr.toDate) params.toDate = dr.toDate;
      
      const r = await c.api.getAll(params);
      let data = r.data.data || [];
      if (tab === "wt") {
        data = data.map(transformWeightRow);
      }
      setRows(data);
    } catch (e) {
      console.error(e);
      setRows([]);
    }
    setLoading(false);
  }, [range, tab, c.api, transformWeightRow]);

  const debouncedLoadData = useMemo(() => debounce(loadData, 300), [loadData]);

  useEffect(() => { debouncedLoadData(); }, [debouncedLoadData]);

  // Calculate today's values
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    if (tab === "bp") {
      const todayRecord = rows.find(r => {
        const d = new Date(r.date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString() === todayStr;
      });
      setTodayBp(todayRecord || null);
    } else if (tab === "bg") {
      const todayRecords = rows.filter(r => {
        const d = new Date(r.date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString() === todayStr;
      });
      setTodayBg(todayRecords.length > 0 ? todayRecords[0] : null);
    } else if (tab === "hr") {
      const todayRecords = rows.filter(r => {
        const d = new Date(r.date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString() === todayStr;
      });
      setTodayHr(todayRecords.length > 0 ? todayRecords[0] : null);
    } else if (tab === "wt") {
      const todayRecord = rows.find(r => {
        const d = new Date(r.date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString() === todayStr;
      });
      setTodayWt(todayRecord || null);
    }
  }, [rows, tab]);

  // Calculate period average and label
  useEffect(() => {
    const { label, daysInPeriod } = getPeriodInfo(range, rows);
    setPeriodLabel(label);

    // Calculate period average based on tab
    if (tab === "bp" && rows.length > 0) {
      const avgSystolic = Math.round(rows.reduce((s, r) => s + r.systolic, 0) / rows.length);
      const avgDiastolic = Math.round(rows.reduce((s, r) => s + r.diastolic, 0) / rows.length);
      setPeriodAvg({ systolic: avgSystolic, diastolic: avgDiastolic });
    } else if (tab === "bg" && rows.length > 0) {
      const avgLevel = Math.round(rows.reduce((s, r) => s + r.level, 0) / rows.length);
      setPeriodAvg(avgLevel);
    } else if (tab === "hr" && rows.length > 0) {
      const avgBpm = Math.round(rows.reduce((s, r) => s + r.bpm, 0) / rows.length);
      setPeriodAvg(avgBpm);
    } else if (tab === "wt" && rows.length > 0) {
      const avgWeight = (rows.reduce((s, r) => s + r.value, 0) / rows.length).toFixed(1);
      setPeriodAvg(avgWeight);
    } else {
      setPeriodAvg(null);
    }
  }, [rows, tab, range]);

  // Calculate chart data
  const chartData = rows.map((r) => {
    if (tab === "bp") {
      return { date: fmt(r.date), systolic: r.systolic, diastolic: r.diastolic };
    } else if (tab === "bg") {
      return { date: fmt(r.date), glucose: r.level };
    } else if (tab === "hr") {
      return { date: fmt(r.date), bpm: r.bpm };
    } else if (tab === "wt") {
      return { date: fmt(r.date), weight: r.value };
    }
    return { date: fmt(r.date) };
  }).reverse();

  // Get today's status based on selected tab (memoized to avoid repeated computation)
  const todayStatus = useMemo(() => {
    if (tab === "bp") {
      if (todayBp) {
        const isGoalMet = todayBp.systolic <= bpGoal;
        return {
          label: "Today's Blood Pressure",
          value: `${todayBp.systolic}/${todayBp.diastolic} / ${bpGoal} mmHg`,
          isGoalMet,
          progress: isGoalMet ? "Normal" : "Elevated",
          progressPercent: isGoalMet ? 100 : Math.min(Math.round((bpGoal / todayBp.systolic) * 100), 100),
          hasProgress: true
        };
      }
      return {
        label: "Today's Blood Pressure",
        value: "No data yet",
        isGoalMet: false,
        progress: "—",
        progressPercent: 0,
        hasProgress: false
      };
    } else if (tab === "bg") {
      if (todayBg) {
        const isGoalMet = todayBg.level <= bgGoal;
        return {
          label: "Today's Glucose",
          value: `${todayBg.level} / ${bgGoal} mg/dL`,
          isGoalMet,
          progress: isGoalMet ? "Normal" : "Elevated",
          progressPercent: isGoalMet ? 100 : Math.min(Math.round((bgGoal / todayBg.level) * 100), 100),
          hasProgress: true
        };
      }
      return {
        label: "Today's Glucose",
        value: "No data yet",
        isGoalMet: false,
        progress: "—",
        progressPercent: 0,
        hasProgress: false
      };
    } else if (tab === "hr") {
      if (todayHr) {
        const isGoalMet = Math.abs(todayHr.bpm - hrGoal) <= 10;
        return {
          label: "Today's Heart Rate",
          value: `${todayHr.bpm} / ${hrGoal} bpm`,
          isGoalMet,
          progress: isGoalMet ? "Normal" : "Variable",
          progressPercent: isGoalMet ? 100 : Math.min(Math.round((100 - Math.abs(todayHr.bpm - hrGoal)) / 10 * 100), 100),
          hasProgress: true
        };
      }
      return {
        label: "Today's Heart Rate",
        value: "No data yet",
        isGoalMet: false,
        progress: "—",
        progressPercent: 0,
        hasProgress: false
      };
    } else if (tab === "wt") {
      if (todayWt) {
        return {
          label: "Today's Weight",
          value: `${todayWt.value} ${todayWt.unit}`,
          isGoalMet: false,
          progress: `${wtGoal} ${todayWt.unit}`,
          progressPercent: 0,
          hasProgress: false
        };
      }
      return {
        label: "Today's Weight",
        value: "No data yet",
        isGoalMet: false,
        progress: "—",
        progressPercent: 0,
        hasProgress: false
      };
    }
    return {
      label: "Today's Progress",
      value: "No data yet",
      isGoalMet: false,
      progress: "—",
      progressPercent: 0,
      hasProgress: false
    };
  }, [tab, todayBp, todayBg, todayHr, todayWt, bpGoal, bgGoal, hrGoal, wtGoal]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Vitals</h1>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                tab === t.key ? "bg-white shadow text-indigo-700" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Date Range Pills */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                range === r.key ? "bg-white shadow text-indigo-700" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${todayStatus.isGoalMet ? "bg-green-100" : "bg-indigo-100"}`}>
              {todayStatus.isGoalMet ? (
                <CheckCircle2 size={24} className="text-green-600" />
              ) : (
                <TrendingUp size={24} className="text-indigo-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">{todayStatus.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayStatus.value}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Progress</p>
            <p className={`text-lg font-semibold ${todayStatus.isGoalMet ? "text-green-600" : "text-indigo-600"}`}>
              {todayStatus.progress}
            </p>
          </div>
        </div>
        {todayStatus.hasProgress && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${todayStatus.isGoalMet ? "bg-green-500" : "bg-indigo-500"}`}
              style={{ width: `${todayStatus.progressPercent}%` }}
            />
          </div>
        )}
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
              {periodAvg !== null && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-indigo-100">
                        <TrendingUp size={24} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{periodLabel}'s Average</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {tab === "bp" && `${periodAvg.systolic}/${periodAvg.diastolic} mmHg`}
                          {tab === "bg" && `${periodAvg} mg/dL`}
                          {tab === "hr" && `${periodAvg} bpm`}
                          {tab === "wt" && `${periodAvg} ${unitPreference === "metric" ? "kg" : "lbs"}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div>
                <h3 className="text-sm text-gray-500 mb-4">{periodLabel} {c.title} Chart</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    {tab === "bp" && (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis domain={[50, 160]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    )}
                    {tab === "bg" && (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis domain={[60, 150]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="glucose" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </LineChart>
                    )}
                    {tab === "hr" && (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis domain={[40, 130]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bpm" stroke="#ec4899" strokeWidth={2} dot={false} />
                      </LineChart>
                    )}
                    {tab === "wt" && (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                        <Tooltip formatter={(value) => [`${value} ${unitPreference === "metric" ? "kg" : "lbs"}`, "Weight"]} />
                        <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CrudPage key={`${tab}-${unitPreference}`} title="" api={wrappedApi} columns={c.columns} formFields={c.formFields} range={range} onRangeChange={setRange} transformRow={c.transformRow} transformSave={c.transformSave} />
    </div>
  );
}
