import CrudPage from "../components/CrudPage";
import { goalApi } from "../api";

const columns = [
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  {
    key: "progress", label: "Progress", render: (r) => {
      const pct = r.progress != null ? r.progress : (r.targetValue > 0 ? Math.min(Math.round((r.currentValue / r.targetValue) * 100), 100) : 0);
      return (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${r.completed ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-gray-500">{pct}%</span>
        </div>
      );
    },
  },
  { key: "currentValue", label: "Current", render: (r) => `${r.currentValue} ${r.unit || ""}` },
  { key: "targetValue", label: "Target", render: (r) => `${r.targetValue} ${r.unit || ""}` },
  { key: "startDate", label: "Start", sortKey: "startDate", render: (r) => r.startDate ? new Date(r.startDate).toLocaleString() : "—" },
  { key: "endDate", label: "Due", render: (r) => new Date(r.endDate).toLocaleString() },
];

const formFields = [
  { name: "title", label: "Title", required: true },
  { name: "category", label: "Category", type: "select", required: true, options: ["activity", "nutrition", "sleep", "weight", "hydration", "blood_pressure", "blood_glucose", "heart_rate", "journal", "other"] },
  { name: "targetValue", label: "Target Value", type: "number", required: true, min: 0 },
  { name: "currentValue", label: "Current Value", type: "number", min: 0, default: 0 },
  { name: "unit", label: "Unit (e.g., miles, lbs, hours)" },
  { name: "startDate", label: "Start Date", type: "date" },
  { name: "endDate", label: "End Date", type: "date", required: true },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Goals() {
  return <CrudPage title="Goals" api={goalApi} columns={columns} formFields={formFields} defaultRange="all" />;
}
