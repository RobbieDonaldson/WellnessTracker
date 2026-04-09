import { useEffect, useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Plus, Pencil, Trash2, X, Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Calendar } from "lucide-react";
import { RANGES, getDateRange } from "../utils/dateRanges";

const PAGE_SIZES = [10, 20, 50];

export default function CrudPage({ title, api, columns, formFields, renderExtra }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  // Grid state
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [range, setRange] = useState("week");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (sortField) params.sort = (sortDir === "desc" ? "-" : "") + sortField;
      const dr = getDateRange(range);
      if (dr.fromDate) params.fromDate = dr.fromDate;
      if (dr.toDate) params.toDate = dr.toDate;
      const r = await api.getAll(params);
      setRows(r.data.data);
      setMeta(r.data.meta);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [page, pageSize, search, sortField, sortDir, range, api]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleSort = (key) => {
    if (sortField === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const openNew = () => {
    setEditing(null);
    const defaults = {};
    formFields.forEach((f) => {
      if ((f.type === "date" || f.type === "datetime-local") && f.default === undefined) {
        defaults[f.name] = new Date();
      } else {
        defaults[f.name] = f.default ?? "";
      }
    });
    setForm(defaults);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row._id);
    const vals = {};
    formFields.forEach((f) => {
      let v = row[f.name];
      if (f.type === "date" || f.type === "datetime-local") {
        v = v ? new Date(v) : null;
      }
      vals[f.name] = v ?? "";
    });
    setForm(vals);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    formFields.forEach((f) => {
      if ((f.type === "date" || f.type === "datetime-local") && payload[f.name] instanceof Date) {
        payload[f.name] = payload[f.name].toISOString();
      }
    });
    if (editing) await api.update(editing, payload);
    else await api.create(payload);
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this record?")) return;
    await api.remove(id);
    load();
  };

  const SortIcon = ({ col }) => {
    if (sortField !== col) return <ChevronUp size={12} className="text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-indigo-600" /> : <ChevronDown size={12} className="text-indigo-600" />;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
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
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search..."
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Rows:</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded-lg px-2 py-1.5 text-sm">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {renderExtra && renderExtra(rows)}

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 py-10 text-center">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 py-10 text-center">{search ? "No matching records." : "No records yet."}</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-indigo-700 transition"
                    onClick={() => c.sortable !== false && toggleSort(c.sortKey || c.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {c.sortable !== false && <SortIcon col={c.sortKey || c.key} />}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">{c.render ? c.render(row) : row[c.key]}</td>
                  ))}
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(row)} className="text-indigo-600 hover:text-indigo-800"><Pencil size={15} /></button>
                    <button onClick={() => remove(row._id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
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
          <span>
            Showing {(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.totalCount)} of {meta.totalCount}
          </span>
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
          <form onSubmit={save} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-auto">
            <button type="button" onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit" : "New"} {title.replace(/s$/, "")}</h2>
            <div className="space-y-4">
              {formFields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.type === "select" ? (
                    <select
                      value={form[f.name]}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      required={f.required}
                    >
                      <option value="">Select...</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      value={form[f.name]}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      rows={3}
                      required={f.required}
                    />
                  ) : f.type === "date" ? (
                    <DatePicker
                      selected={form[f.name] instanceof Date ? form[f.name] : form[f.name] ? new Date(form[f.name]) : null}
                      onChange={(d) => setForm({ ...form, [f.name]: d })}
                      dateFormat="MMMM d, yyyy"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      required={f.required}
                    />
                  ) : f.type === "datetime-local" ? (
                    <DatePicker
                      selected={form[f.name] instanceof Date ? form[f.name] : form[f.name] ? new Date(form[f.name]) : null}
                      onChange={(d) => setForm({ ...form, [f.name]: d })}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      required={f.required}
                    />
                  ) : (
                    <input
                      type={f.type || "text"}
                      value={form[f.name]}
                      onChange={(e) => setForm({ ...form, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      required={f.required}
                      step={f.step}
                      min={f.min}
                      max={f.max}
                    />
                  )}
                </div>
              ))}
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
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
