import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Calendar } from "lucide-react";
import { activityApi } from "../api";
import api from "../api";
import { RANGES, getDateRange } from "../utils/dateRanges";

const TYPES = ["running", "walking", "cycling", "swimming", "weightlifting", "yoga", "hiking", "other"];
const PAGE_SIZES = [10, 20, 50];
const COLS = [
  { key: "type", label: "Type" },
  { key: "duration", label: "Duration" },
  { key: "caloriesBurned", label: "Calories" },
  { key: "distance", label: "Distance" },
  { key: "date", label: "Date" },
];

export default function Activities() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: "", duration: "", caloriesBurned: 0, distance: "", notes: "", date: "", manualCalories: false });
  const [estimating, setEstimating] = useState(false);

  // Grid state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [range, setRange] = useState("week");

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
      setRows(r.data.data);
      setMeta(r.data.meta);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, pageSize, search, sortField, sortDir, range]);

  useEffect(() => { load(); }, [load]);

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
    setForm({ type: "", duration: "", caloriesBurned: 0, distance: "", notes: "", date: "", manualCalories: false });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row._id);
    setForm({
      type: row.type,
      duration: row.duration,
      caloriesBurned: row.caloriesBurned,
      distance: row.distance ?? "",
      notes: row.notes ?? "",
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : "",
      manualCalories: false,
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, duration: Number(form.duration), caloriesBurned: Number(form.caloriesBurned) };
    if (form.distance) payload.distance = Number(form.distance);
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Activities</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Date Range Pills */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <Calendar size={14} className="text-gray-400 ml-2 mr-1" />
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

      {/* Search + Page Size */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search type, notes..." className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Rows:</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded-lg px-2 py-1.5 text-sm">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 py-10 text-center">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 py-10 text-center">{search ? "No matching activities." : "No activities yet."}</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                {COLS.map((c) => (
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
                  <td className="px-4 py-3 capitalize">{r.type}</td>
                  <td className="px-4 py-3">{r.duration} min</td>
                  <td className="px-4 py-3">{r.caloriesBurned}</td>
                  <td className="px-4 py-3">{r.distance != null ? `${r.distance} mi` : "—"}</td>
                  <td className="px-4 py-3">{new Date(r.date).toLocaleDateString()}</td>
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
          <div className="flex items-center gap-1">
            <PgBtn disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft size={16} /></PgBtn>
            <PgBtn disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></PgBtn>
            <span className="px-3 py-1 text-sm font-medium">Page {meta.page} of {meta.totalPages}</span>
            <PgBtn disabled={page === meta.totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></PgBtn>
            <PgBtn disabled={page === meta.totalPages} onClick={() => setPage(meta.totalPages)}><ChevronsRight size={16} /></PgBtn>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance (mi)</label>
                <input type="number" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" step="0.01" min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
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
