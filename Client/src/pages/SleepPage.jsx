import CrudPage from "../components/CrudPage";
import { sleepApi } from "../api";

const columns = [
  { key: "bedtime", label: "Bedtime", render: (r) => new Date(r.bedtime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
  { key: "wakeTime", label: "Wake", render: (r) => new Date(r.wakeTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
  { key: "duration", label: "Hours", render: (r) => r.duration != null ? `${r.duration} hrs` : "—" },
  { key: "quality", label: "Quality" },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
];

const formFields = [
  { name: "bedtime", label: "Bedtime", type: "datetime-local", required: true },
  { name: "wakeTime", label: "Wake Time", type: "datetime-local", required: true },
  { name: "quality", label: "Quality", type: "select", options: ["poor", "fair", "good", "excellent"], default: "good" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

export default function SleepPage() {
  return <CrudPage title="Sleep" api={sleepApi} columns={columns} formFields={formFields} />;
}
