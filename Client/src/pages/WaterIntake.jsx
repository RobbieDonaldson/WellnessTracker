import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronUp, ChevronDown, CheckCircle2, TrendingUp } from "lucide-react";
import CrudPage from "../components/CrudPage";
import { waterIntakeApi, goalApi } from "../api";
import { RANGES, getDateRange, getPeriodInfo } from "../utils/dateRanges";
import { useAuth } from "../context/AuthContext";
import { convertVolume, getVolumeUnit } from "../utils/unitConversion";

// Format date for chart display
function fmt(dateStr) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// Dynamic columns and formFields based on user preference
const getColumns = (unitPreference) => [
  { 
    key: "amount", 
    label: "Amount", 
    render: (r) => {
      return `${r.amount} ${r.unit || ""}`;
    }
  },
  { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleString() },
];

const getFormFields = (unitPreference) => {
  const isMetric = unitPreference === "metric";
  const volumeUnit = isMetric ? "ml" : "oz";
  return [
    { 
      name: "amount", 
      label: `Amount (${volumeUnit})`, 
      type: "number", 
      required: true, 
      min: isMetric ? 30 : 1, // ~1 oz = 30 ml
      max: isMetric ? 15000 : 500 // ~500 oz = 15000 ml
    },
    { 
      name: "unit", 
      label: "Unit", 
      type: "select", 
      options: [volumeUnit], 
      default: volumeUnit, 
      readOnly: true 
    },
    { name: "notes", label: "Notes", type: "textarea" },
    { name: "date", label: "Date", type: "date" },
  ];
};

export default function WaterIntakePage() {
  const { user } = useAuth();
  const unitPreference = user?.unitPreference || "standard";
  const columns = getColumns(unitPreference);
  const formFields = getFormFields(unitPreference);
  
  // Data state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartCollapsed, setChartCollapsed] = useState(true);
  const [range, setRange] = useState("week");
  const [periodLabel, setPeriodLabel] = useState("This Week");
  
  // Today's value
  const [todayAmount, setTodayAmount] = useState(0);
  
  // Period value
  const [periodTotal, setPeriodTotal] = useState(0);
  const [periodGoal, setPeriodGoal] = useState(unitPreference === "metric" ? 1892 : 64); // Default 64 oz/day or 1892 ml/day
  const dailyGoal = unitPreference === "metric" ? 1892 : 64;
  const volumeUnit = unitPreference === "metric" ? "ml" : "oz";

  // Transform row for editing
  const transformRow = useCallback((row) => {
    const targetUnit = unitPreference === "metric" ? "ml" : "oz";
    if (row.unit !== targetUnit) {
      return {
        ...row,
        amount: Math.round(convertVolume(row.amount, row.unit, targetUnit)),
        unit: targetUnit,
      };
    }
    return row;
  }, [unitPreference]);

  // Transform payload before saving (always save in standard units - oz)
  const transformSave = (payload) => {
    if (unitPreference === "metric" && payload.amount) {
      return {
        ...payload,
        amount: Math.round(convertVolume(Number(payload.amount), "ml", "oz")),
        unit: "oz",
      };
    }
    return payload;
  };
  
  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      const dr = getDateRange(range);
      if (dr.fromDate) params.fromDate = dr.fromDate;
      if (dr.toDate) params.toDate = dr.toDate;
      const r = await waterIntakeApi.getAll(params);
      const data = r.data.data || [];
      const transformedData = data.map(transformRow);
      setRows(transformedData);
      const today = new Date().toDateString();
      const todayEntries = transformedData.filter((entry) => new Date(entry.date).toDateString() === today);
      setTodayAmount(todayEntries.reduce((sum, e) => sum + e.amount, 0));
      setPeriodTotal(transformedData.reduce((sum, e) => sum + e.amount, 0));
    } catch (err) {
      console.error("Failed to load water intake data", err);
    } finally {
      setLoading(false);
    }
  }, [range, transformRow]);

  useEffect(() => { loadData(); }, [loadData]);

  // Calculate period total and label
  useEffect(() => {
    const { label, daysInPeriod } = getPeriodInfo(range, rows);
    setPeriodLabel(label);

    const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
    setPeriodTotal(total);
    const dailyGoal = unitPreference === "metric" ? 1892 : 64; // 64 oz/day or 1892 ml/day
    setPeriodGoal(dailyGoal * daysInPeriod);
  }, [rows, range, unitPreference]);

  // Calculate chart data
  const chartData = rows.map((r) => ({
    date: fmt(r.date),
    amount: r.amount,
  })).reverse();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Water Intake</h1>

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
            <div className={`p-3 rounded-lg ${todayAmount >= dailyGoal ? "bg-green-100" : "bg-indigo-100"}`}>
              {todayAmount >= dailyGoal ? (
                <CheckCircle2 size={24} className="text-green-600" />
              ) : (
                <TrendingUp size={24} className="text-indigo-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Water Intake</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayAmount} <span className="text-sm font-normal text-gray-400">/ {dailyGoal} {volumeUnit}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Progress</p>
            <p className={`text-lg font-semibold ${todayAmount >= dailyGoal ? "text-green-600" : "text-indigo-600"}`}>
              {Math.min(Math.round((todayAmount / dailyGoal) * 100), 100)}%
            </p>
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${todayAmount >= dailyGoal ? "bg-green-500" : "bg-indigo-500"}`}
            style={{ width: `${Math.min(Math.round((todayAmount / dailyGoal) * 100), 100)}%` }}
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
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-indigo-100">
                      <TrendingUp size={24} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{periodLabel}'s Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {periodTotal} <span className="text-sm font-normal text-gray-400">/ {periodGoal} {volumeUnit}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {Math.min(Math.round((periodTotal / periodGoal) * 100), 100)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all bg-indigo-500"
                    style={{ width: `${Math.min(Math.round((periodTotal / periodGoal) * 100), 100)}%` }}
                  />
                </div>
              </div>

              {/* Chart */}
              <div>
                <h3 className="text-sm text-gray-500 mb-4">{periodLabel} Water Intake Chart</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} ${unitPreference === "metric" ? "ml" : "oz"}`, "Water"]} />
                      <Bar dataKey="amount" fill="#06b6d4" name={`Water (${volumeUnit})`} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CrudPage key={unitPreference} title="" api={waterIntakeApi} columns={columns} formFields={formFields} range={range} onRangeChange={setRange} transformRow={transformRow} transformSave={transformSave} />
    </div>
  );
}
