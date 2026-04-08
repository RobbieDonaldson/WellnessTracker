import CrudPage from "../components/CrudPage";
import { waterIntakeApi } from "../api";

const columns = [
  { key: "amount", label: "Amount", render: (r) => `${r.amount} ${r.unit}` },
  { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
];

const formFields = [
  { name: "amount", label: "Amount (oz)", type: "number", required: true, min: 1, max: 500 },
  { name: "unit", label: "Unit", type: "select", options: ["oz", "ml"], default: "oz" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

export default function WaterIntakePage() {
  return <CrudPage title="Water Intake" api={waterIntakeApi} columns={columns} formFields={formFields} />;
}
