import { useEffect, useState, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Plus, Pencil, Trash2, X, Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Calendar, CheckCircle2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { activityApi, goalApi } from "../api";
import api from "../api";
import { RANGES, getDateRange, getPeriodInfo } from "../utils/dateRanges";
import { useAuth } from "../context/AuthContext";
import { convertWeight, convertDistance, getWeightUnit, getDistanceUnit } from "../utils/unitConversion";

const TYPES = ["running", "walking", "cycling", "swimming", "weightlifting", "yoga", "hiking", "other"];
const PAGE_SIZES = [10, 20, 50];

// Format date for chart display
function fmt(dateStr) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
const COLS = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "duration", label: "Duration" },
  { key: "caloriesBurned", label: "Calories" },
  { key: "distance", label: "Distance" },
  { key: "date", label: "Date" },
];

// Dynamic columns based on unit preference
const getColumns = (unitPreference) => {
  const distanceUnit = unitPreference === "metric" ? "km" : "mi";
  return [
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "duration", label: "Duration" },
    { key: "caloriesBurned", label: "Calories" },
    { 
      key: "distance", 
      label: "Distance", 
      render: (r) => {
        if (r.distance == null) return "—";
        return `${r.distance} ${r.distanceUnit || distanceUnit}`;
      }
    },
    { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleString() },
  ];
};

export default function Activities() {
  const { user } = useAuth();
  const unitPreference = user?.unitPreference || "standard";
  const distanceUnit = unitPreference === "metric" ? "km" : "mi";
  const weightUnit = unitPreference === "metric" ? "kg" : "lbs";
  const columns = getColumns(unitPreference);
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "", duration: "", caloriesBurned: "", distance: "", distanceUnit: distanceUnit, weight: "", reps: "", sets: "", steps: "", notes: "", date: new Date(), manualCalories: false });
  const [estimating, setEstimating] = useState(false);
  const [periodMinutes, setPeriodMinutes] = useState(0);
  const [periodGoal, setPeriodGoal] = useState(30);
  const [periodLabel, setPeriodLabel] = useState("This Week");
  const [dailyGoal, setDailyGoal] = useState(30); // Default 30 minutes
  const [chartCollapsed, setChartCollapsed] = useState(true); // Default collapsed
  const [todayMinutes, setTodayMinutes] = useState(0);

  // Grid state
  const [searchInput, setSearchInput] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [range, setRange] = useState("week");
  
  // Transform row for display
  const transformRow = useCallback((row) => {
    const transformed = { ...row };
    // Convert distance
    if (row.distance != null) {
      const storedUnit = row.distanceUnit || "mi";
      if (storedUnit !== distanceUnit) {
        transformed.distance = Number(convertDistance(row.distance, storedUnit, distanceUnit).toFixed(2));
        transformed.distanceUnit = distanceUnit;
      }
    }
    // Convert weight
    if (row.weight != null) {
      if (unitPreference === "metric") {
        transformed.weight = Number(convertWeight(row.weight, "lbs", "kg").toFixed(1));
      } else {
        transformed.weight = row.weight;
      }
    }
    return transformed;
  }, [distanceUnit, unitPreference]);
  
  const load = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: pageSize };
    if (search.trim()) params.search = search.trim();
    if (sortField) params.sort = (sortDir === "desc" ? "-" : "") + sortField;
    const dr = getDateRange(range);
    if (dr.fromDate) params.fromDate = dr.fromDate;
    if (dr.toDate) params.toDate = dr.toDate;
    try {
      const r = await activityApi.getAll(params);
      const data = r.data.data || [];
      const transformedData = data.map(transformRow);
      setRows(transformedData);
      setMeta(r.data.meta);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, pageSize, search, sortField, sortDir, range, transformRow]);

  useEffect(() => { load(); }, [load]);

  // Calculate today's exercise minutes (always based on today, not range)
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    const total = rows.reduce((sum, r) => {
      const activityDate = new Date(r.date);
      activityDate.setHours(0, 0, 0, 0);
      if (activityDate.toISOString() === todayStr) {
        return sum + (r.duration || 0);
      }
      return sum;
    }, 0);
    
    setTodayMinutes(total);
  }, [rows]);

  // Calculate period exercise minutes and goal based on current range
  useEffect(() => {
    const dr = getDateRange(range);
    const fromDate = dr.fromDate ? new Date(dr.fromDate) : null;
    const toDate = dr.toDate ? new Date(dr.toDate) : null;
    
    const total = rows.reduce((sum, r) => {
      const activityDate = new Date(r.date);
      if (fromDate && activityDate < fromDate) return sum;
      if (toDate && activityDate > toDate) return sum;
      return sum + (r.duration || 0);
    }, 0);
    
    setPeriodMinutes(total);
    
    // Calculate period goal based on daily goal and number of days
    const { label, daysInPeriod } = getPeriodInfo(range, rows);
    setPeriodLabel(label);
    
    setPeriodGoal(dailyGoal * daysInPeriod);
  }, [rows, range, dailyGoal]);

  // Fetch daily exercise goal from goals API
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const response = await goalApi.getAll({ limit: 100 });
        const activityGoals = response.data.data.filter(g => g.category === "activity" && g.unit === "minutes");
        if (activityGoals.length > 0) {
          // Use the most recent activity goal with minutes unit
          const goal = activityGoals[0];
          setDailyGoal(goal.targetValue);
        }
      } catch (e) {
        console.error("Failed to fetch goals:", e);
      }
    };
    fetchGoal();
  }, []);

  // Calculate chart data based on current rows and range
  const chartData = rows.map((r) => ({
    date: fmt(r.date),
    calories: r.caloriesBurned,
    duration: r.duration,
  })).reverse(); // Reverse to show chronological order

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleSort = (key) => {
    if (sortField === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(key); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ col }) => {
    if (sortField !== col) return <ChevronUp size={12} className="text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-indigo-600" /> : <ChevronDown size={12} className="text-indigo-600" />;
  };

  // Live calorie estimate
  const estimate = useCallback(async (type, duration) => {
    if (!type || !duration || duration < 1) return;
    setEstimating(true);
    try {
      const { data } = await api.post("/activities/estimate", { type, duration: Number(duration) });
      setForm((prev) => prev.manualCalories ? prev : { ...prev, caloriesBurned: data.caloriesBurned });
    } catch (e) { /* ignore */ }
    setEstimating(false);
  }, []);

  const onFieldChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if ((field === "type" || field === "duration") && !next.manualCalories) {
      estimate(next.type, next.duration);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", type: "", duration: "", caloriesBurned: 0, distance: "", reps: "", sets: "", steps: "", notes: "", date: new Date(), manualCalories: false });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row._id);
    
    // Convert distance to user's preference
    let convertedDistance = row.distance ?? "";
    if (row.distance && row.distanceUnit && row.distanceUnit !== distanceUnit) {
      convertedDistance = convertDistance(row.distance, row.distanceUnit, distanceUnit);
    }
    
    // Convert weight to user's preference
    let convertedWeight = row.weight ?? "";
    if (row.weight) {
      // Weight is always stored in lbs, convert to kg if metric
      convertedWeight = unitPreference === "metric" ? convertWeight(row.weight, "lbs", "kg") : row.weight;
    }
    
    setForm({
      name: row.name ?? "",
      type: row.type,
      duration: row.duration,
      caloriesBurned: row.caloriesBurned,
      distance: convertedDistance,
      reps: row.reps ?? "",
      sets: row.sets ?? "",
      weight: convertedWeight,
      steps: row.steps ?? "",
      notes: row.notes ?? "",
      date: row.date ? new Date(row.date) : new Date(),
      manualCalories: false,
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, duration: Number(form.duration), caloriesBurned: Number(form.caloriesBurned), distanceUnit };
    if (payload.date instanceof Date) payload.date = payload.date.toISOString();
    
    // Convert distance back to standard units for storage (always store in mi)
    if (form.distance) {
      payload.distance = Number(form.distance);
      if (unitPreference === "metric") {
        // Convert km to mi for storage
        payload.distance = convertDistance(Number(form.distance), "km", "mi");
        payload.distanceUnit = "mi";
      } else {
        // Already in mi
        payload.distanceUnit = "mi";
      }
    }
    
    // Convert weight back to lbs for storage (always store in lbs)
    if (form.weight) {
      if (unitPreference === "metric") {
        // Convert kg to lbs for storage
        payload.weight = convertWeight(Number(form.weight), "kg", "lbs");
      } else {
        // Already in lbs
        payload.weight = Number(form.weight);
      }
    } else {
      payload.weight = null;
    }
    
    if (form.reps) payload.reps = Number(form.reps); else payload.reps = null;
    if (form.sets) payload.sets = Number(form.sets); else payload.sets = null;
    if (form.steps) payload.steps = Number(form.steps); else payload.steps = null;
    if (editing) await activityApi.update(editing, payload);
    else await activityApi.create(payload);
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this activity?")) return;
    await activityApi.remove(id);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Activities</h1>

      {/* Date Range Pills */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => { setRange(r.key); setPage(1); }}
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
            <div className={`p-3 rounded-lg ${todayMinutes >= dailyGoal ? "bg-green-100" : "bg-indigo-100"}`}>
              {todayMinutes >= dailyGoal ? (
                <CheckCircle2 size={24} className="text-green-600" />
              ) : (
                <TrendingUp size={24} className="text-indigo-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Exercise</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayMinutes} <span className="text-sm font-normal text-gray-400">/ {dailyGoal} min</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Progress</p>
            <p className={`text-lg font-semibold ${todayMinutes >= dailyGoal ? "text-green-600" : "text-indigo-600"}`}>
              {Math.min(Math.round((todayMinutes / dailyGoal) * 100), 100)}%
            </p>
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${todayMinutes >= dailyGoal ? "bg-green-500" : "bg-indigo-500"}`}
            style={{ width: `${Math.min(Math.round((todayMinutes / dailyGoal) * 100), 100)}%` }}
          />
        </div>
      </div>

      {/* Collapsible Period Progress */}
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
            {/* Period Activity Summary */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${periodMinutes >= periodGoal ? "bg-green-100" : "bg-indigo-100"}`}>
                    {periodMinutes >= periodGoal ? (
                      <CheckCircle2 size={24} className="text-green-600" />
                    ) : (
                      <TrendingUp size={24} className="text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{periodLabel}'s Exercise</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {periodMinutes} <span className="text-sm font-normal text-gray-400">/ {periodGoal} min</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className={`text-lg font-semibold ${periodMinutes >= periodGoal ? "text-green-600" : "text-indigo-600"}`}>
                    {Math.min(Math.round((periodMinutes / periodGoal) * 100), 100)}%
                  </p>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${periodMinutes >= periodGoal ? "bg-green-500" : "bg-indigo-500"}`}
                  style={{ width: `${Math.min(Math.round((periodMinutes / periodGoal) * 100), 100)}%` }}
                />
              </div>
            </div>

            {/* Activity Chart */}
            {chartData.length > 0 && (
              <div>
                <h3 className="text-sm text-gray-500 mb-4">{periodLabel} Activity Chart</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
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
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search type, notes..." className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" />
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus size={16} /> New Entry
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 py-10 text-center">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 py-10 text-center">{search ? "No matching activities." : "No activities yet."}</p>
      ) : (
        <div key={unitPreference} className="bg-white rounded-xl shadow-sm border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-indigo-700" onClick={() => toggleSort(c.key)}>
                    <span className="inline-flex items-center gap-1">{c.label} <SortIcon col={c.key} /></span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">{c.render ? c.render(r) : r[c.key]}</td>
                  ))}
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(r)} className="text-indigo-600 hover:text-indigo-800"><Pencil size={15} /></button>
                    <button onClick={() => remove(r._id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.totalCount > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Showing {(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.totalCount)} of {meta.totalCount}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Rows:</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded-lg px-2 py-1.5 text-sm">
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <PgBtn disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft size={16} /></PgBtn>
              <PgBtn disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></PgBtn>
              <span className="px-3 py-1 text-sm font-medium">Page {meta.page} of {meta.totalPages}</span>
              <PgBtn disabled={page === meta.totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></PgBtn>
              <PgBtn disabled={page === meta.totalPages} onClick={() => setPage(meta.totalPages)}><ChevronsRight size={16} /></PgBtn>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={save} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
            <button type="button" onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit" : "New"} Activity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Morning Run, Bench Press" required maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={(e) => onFieldChange("type", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required>
                  <option value="">Select...</option>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input type="number" value={form.duration} onChange={(e) => onFieldChange("duration", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required min={1} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    Calories Burned {!form.manualCalories && <span className="text-xs text-indigo-500 font-normal">(auto-estimated{estimating ? "..." : ""})</span>}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={form.manualCalories} onChange={(e) => setForm({ ...form, manualCalories: e.target.checked })} className="rounded" />
                    Manual override
                  </label>
                </div>
                <input
                  type="number"
                  value={form.caloriesBurned}
                  onChange={(e) => setForm({ ...form, caloriesBurned: Number(e.target.value) })}
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${!form.manualCalories ? "bg-gray-50 text-gray-600" : ""}`}
                  readOnly={!form.manualCalories}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance ({distanceUnit})</label>
                <input type="number" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" step="0.01" min={0} />
              </div>
              {form.type === "weightlifting" && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
                    <input type="number" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" min={0} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                    <input type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" min={0} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight ({weightUnit})</label>
                    <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" min={0} />
                  </div>
                </div>
              )}
              {form.type === "walking" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
                  <input type="number" value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" min={0} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <DatePicker
                  selected={form.date instanceof Date ? form.date : form.date ? new Date(form.date) : null}
                  onChange={(d) => setForm({ ...form, date: d })}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  withPortal
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function PgBtn({ disabled, onClick, children }) {
  return (
    <button onClick={onClick} disabled={disabled} className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
      {children}
    </button>
  );
}
