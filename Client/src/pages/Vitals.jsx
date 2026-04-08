import { useState } from "react";
import CrudPage from "../components/CrudPage";
import { bloodPressureApi, bloodGlucoseApi, heartRateApi, weightApi } from "../api";

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
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
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
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
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
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
];
const hrFields = [
  { name: "bpm", label: "Heart Rate (bpm)", type: "number", required: true, min: 20, max: 250 },
  { name: "context", label: "Context", type: "select", options: ["resting", "active", "post_exercise", "sleeping"], default: "resting" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

const wtColumns = [
  { key: "value", label: "Weight", render: (r) => `${r.value} ${r.unit}` },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
];
const wtFields = [
  { name: "value", label: "Weight", type: "number", required: true, step: "0.1", min: 50, max: 800 },
  { name: "unit", label: "Unit", type: "select", options: ["lbs", "kg"], default: "lbs" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

const config = {
  bp: { title: "Blood Pressure", api: bloodPressureApi, columns: bpColumns, formFields: bpFields },
  bg: { title: "Blood Glucose", api: bloodGlucoseApi, columns: bgColumns, formFields: bgFields },
  hr: { title: "Heart Rate", api: heartRateApi, columns: hrColumns, formFields: hrFields },
  wt: { title: "Weight", api: weightApi, columns: wtColumns, formFields: wtFields },
};

export default function Vitals() {
  const [tab, setTab] = useState("bp");
  const c = config[tab];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Vitals</h1>
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
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
      <CrudPage key={tab} title={c.title} api={c.api} columns={c.columns} formFields={c.formFields} />
    </div>
  );
}
