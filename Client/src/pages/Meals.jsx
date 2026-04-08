import CrudPage from "../components/CrudPage";
import { mealApi } from "../api";

const columns = [
  { key: "name", label: "Name" },
  { key: "mealType", label: "Meal" },
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
];

const formFields = [
  { name: "name", label: "Name", required: true },
  { name: "mealType", label: "Meal Type", type: "select", required: true, options: ["breakfast", "lunch", "dinner", "snack"] },
  { name: "calories", label: "Calories", type: "number", required: true, min: 0 },
  { name: "protein", label: "Protein (g)", type: "number", min: 0, default: 0 },
  { name: "carbs", label: "Carbs (g)", type: "number", min: 0, default: 0 },
  { name: "fat", label: "Fat (g)", type: "number", min: 0, default: 0 },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "date", label: "Date", type: "date" },
];

export default function Meals() {
  return <CrudPage title="Meals" api={mealApi} columns={columns} formFields={formFields} />;
}
