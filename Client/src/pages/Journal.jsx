import { useEffect, useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Plus, Pencil, Trash2, X, Search, ChevronUp, ChevronDown,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Calendar, BookHeart, RefreshCw,
} from "lucide-react";
import { journalApi } from "../api";
import { RANGES, getDateRange } from "../utils/dateRanges";

const MOODS = [
  "Happy", "Grateful", "Peaceful", "Hopeful", "Joyful", "Content",
  "Anxious", "Sad", "Angry", "Lonely", "Fearful", "Overwhelmed",
  "Confused", "Frustrated", "Guilty", "Ashamed", "Jealous", "Grief",
  "Stressed", "Tired", "Discouraged", "Worried", "Depressed", "Restless",
];

const MOOD_COLORS = {
  Happy: "bg-yellow-100 text-yellow-800", Grateful: "bg-amber-100 text-amber-800",
  Peaceful: "bg-sky-100 text-sky-800", Hopeful: "bg-emerald-100 text-emerald-800",
  Joyful: "bg-orange-100 text-orange-800", Content: "bg-teal-100 text-teal-800",
  Anxious: "bg-violet-100 text-violet-800", Sad: "bg-blue-100 text-blue-800",
  Angry: "bg-red-100 text-red-800", Lonely: "bg-indigo-100 text-indigo-800",
  Fearful: "bg-purple-100 text-purple-800", Overwhelmed: "bg-rose-100 text-rose-800",
  Confused: "bg-gray-100 text-gray-800", Frustrated: "bg-orange-100 text-orange-800",
  Guilty: "bg-stone-100 text-stone-800", Ashamed: "bg-zinc-100 text-zinc-800",
  Jealous: "bg-lime-100 text-lime-800", Grief: "bg-slate-100 text-slate-800",
  Stressed: "bg-pink-100 text-pink-800", Tired: "bg-cyan-100 text-cyan-800",
  Discouraged: "bg-neutral-100 text-neutral-800", Worried: "bg-fuchsia-100 text-fuchsia-800",
  Depressed: "bg-blue-100 text-blue-800", Restless: "bg-amber-100 text-amber-800",
};

const PAGE_SIZES = [10, 20, 50];

export default function Journal() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ mood: "", title: "", content: "", date: new Date() });

  // Verses
  const [verses, setVerses] = useState([]);
  const [versesLoading, setVersesLoading] = useState(false);

  // Grid state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [range, setRange] = useState("month");

  const load = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: pageSize };
    if (search.trim()) params.search = search.trim();
    if (sortField) params.sort = (sortDir === "desc" ? "-" : "") + sortField;
    const dr = getDateRange(range);
    if (dr.fromDate) params.fromDate = dr.fromDate;
    if (dr.toDate) params.toDate = dr.toDate;
    try {
      const r = await journalApi.getAll(params);
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

  // Fetch verses when mood changes in form
  const fetchVerses = async (mood) => {
    if (!mood) { setVerses([]); return; }
    setVersesLoading(true);
    try {
      const { data } = await journalApi.getVerses(mood);
      setVerses(data.verses);
    } catch { setVerses([]); }
    setVersesLoading(false);
  };

  const onMoodChange = (mood) => {
    setForm((prev) => ({ ...prev, mood }));
    fetchVerses(mood);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ mood: "", title: "", content: "", date: new Date() });
    setVerses([]);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row._id);
    setForm({
      mood: row.mood,
      title: row.title,
      content: row.content || "",
      date: row.date ? new Date(row.date) : new Date(),
    });
    fetchVerses(row.mood);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, date: form.date instanceof Date ? form.date.toISOString() : form.date };
    if (editing) await journalApi.update(editing, payload);
    else await journalApi.create(payload);
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this journal entry?")) return;
    await journalApi.remove(id);
    load();
  };

  const COLS = [
    { key: "mood", label: "Mood" },
    { key: "title", label: "Title" },
    { key: "date", label: "Date" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"> Journal</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus size={16} /> New Entry
        </button>
      </div>

      {/* Date Range Pills */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <Calendar size={14} className="text-gray-400 ml-2 mr-1" />
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => { setRange(r.key); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${range === r.key ? "bg-white shadow text-indigo-700" : "text-gray-600 hover:text-gray-900"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Search + Page Size */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search mood, title, content..." className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Rows:</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded-lg px-2 py-1.5 text-sm">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 py-10 text-center">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 py-10 text-center">{search ? "No matching entries." : "No journal entries yet."}</p>
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
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${MOOD_COLORS[r.mood] || "bg-gray-100 text-gray-800"}`}>
                      {r.mood}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3">{new Date(r.date).toLocaleString()}</td>
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
          <form onSubmit={save} className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-auto">
            <button type="button" onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit" : "New"} Journal Entry</h2>

            <div className="space-y-4">
              {/* Mood Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How do you feel today?</label>
                <select
                  value={form.mood}
                  onChange={(e) => onMoodChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select your mood...</option>
                  {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Bible Verses */}
              {form.mood && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                      <BookHeart size={16} /> Scripture for the {form.mood}
                    </h3>
                    <button
                      type="button"
                      onClick={() => fetchVerses(form.mood)}
                      disabled={versesLoading}
                      className="text-amber-600 hover:text-amber-800 p-1"
                      title="Get new verses"
                    >
                      <RefreshCw size={14} className={versesLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                  {versesLoading ? (
                    <p className="text-xs text-amber-600">Loading verses...</p>
                  ) : verses.length > 0 ? (
                    <div className="space-y-2.5">
                      {verses.map((v, i) => (
                        <div key={i} className="text-sm">
                          <p className="text-amber-900 italic">"{v.text}"</p>
                          <p className="text-amber-700 text-xs font-medium mt-0.5">— {v.reference} (KJV)</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-xs text-gray-400">(max 50 chars)</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value.slice(0, 50) })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Give your entry a title..."
                  maxLength={50}
                  required
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/50</p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Journal Entry</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={6}
                  placeholder="Write your thoughts..."
                />
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <DatePicker
                  selected={form.date}
                  onChange={(d) => setForm({ ...form, date: d })}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
