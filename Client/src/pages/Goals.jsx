import { useState, useMemo } from "react";
import CrudPage from "../components/CrudPage";
import { goalApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { convertWeight, convertDistance, convertVolume } from "../utils/unitConversion";

const getColumns = (unitPreference) => {
  const isMetric = unitPreference === "metric";
  return [
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    {
      key: "progress", label: "Progress", render: (r) => {
        const now = new Date();
        const startDate = new Date(r.startDate);
        const endDate = new Date(r.endDate);
        
        // Check if goal is in the future
        if (now < startDate) {
          return <span className="text-xs text-gray-400 italic">Future goal; not started yet</span>;
        }
        
        // Goal is current or past - show progress bar
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
    { 
      key: "currentValue", 
      label: "Current", 
      render: (r) => {
        if (r.currentValue == null) return "—";
        return `${r.currentValue} ${r.unit || ""}`;
      }
    },
    { 
      key: "targetValue", 
      label: "Target", 
      render: (r) => {
        if (r.targetValue == null) return "—";
        return `${r.targetValue} ${r.unit || ""}`;
      }
    },
    { key: "startDate", label: "Start", sortKey: "startDate", render: (r) => r.startDate ? new Date(r.startDate).toLocaleString() : "—" },
    { key: "endDate", label: "Due", render: (r) => new Date(r.endDate).toLocaleString() },
  ];
};

function getDisplayUnit(unit, unitPreference) {
  if (!unit) return unit;
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit === "lbs" || lowerUnit === "pounds") {
    return unitPreference === "metric" ? "kg" : unit;
  }
  if (lowerUnit === "mi" || lowerUnit === "miles") {
    return unitPreference === "metric" ? "km" : unit;
  }
  if (lowerUnit === "oz" || lowerUnit === "ounces") {
    return unitPreference === "metric" ? "ml" : unit;
  }
  return unit;
}

function convertValue(value, fromUnit, toUnit) {
  if (!value || value === null || fromUnit === toUnit) return value;
  const lowerFrom = fromUnit.toLowerCase();
  const lowerTo = toUnit.toLowerCase();
  
  if ((lowerFrom === "lbs" || lowerFrom === "pounds") && lowerTo === "kg") {
    return (value * 0.45359237).toFixed(1);
  }
  if (lowerFrom === "kg" && (lowerTo === "lbs" || lowerTo === "pounds")) {
    return (value * 2.20462).toFixed(1);
  }
  if ((lowerFrom === "mi" || lowerFrom === "miles") && lowerTo === "km") {
    return (value * 1.609344).toFixed(2);
  }
  if (lowerFrom === "km" && (lowerTo === "mi" || lowerTo === "miles")) {
    return (value * 0.621371).toFixed(2);
  }
  if ((lowerFrom === "oz" || lowerFrom === "ounces") && lowerTo === "ml") {
    return Math.round(value * 29.5735);
  }
  if (lowerFrom === "ml" && (lowerTo === "oz" || lowerTo === "ounces")) {
    return (value * 0.033814).toFixed(1);
  }
  // If units don't match any conversion, return as-is
  return value;
}

const getFormFields = (unitPreference) => {
  const isMetric = unitPreference === "metric";
  return [
    { name: "title", label: "Title", required: true },
    { name: "category", label: "Category", type: "select", required: true, options: ["activity", "nutrition", "sleep", "weight", "hydration", "blood_pressure", "blood_glucose", "heart_rate", "journal"] },
    { name: "targetValue", label: "Target Value", type: "number", required: true, min: 0 },
    { name: "currentValue", label: "Current Value", type: "number", min: 0, default: 0 },
    { name: "unit", label: isMetric ? "Unit (e.g., km, kg, ml)" : "Unit (e.g., miles, lbs, oz)" },
    { name: "threshold", label: "Threshold (optional)", type: "number", min: 0, helpText: "For hydration: daily oz target. For blood glucose: mg/dL threshold." },
    { name: "thresholdUnit", label: "Threshold Unit", helpText: "e.g., oz, mg/dL" },
    { name: "startDate", label: "Start Date", type: "date" },
    { name: "endDate", label: "End Date", type: "date", required: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
};

const getTransformRow = (unitPreference) => (row) => {
  const isMetric = unitPreference === "metric";
  if (!row.unit) return row;
  const lowerUnit = row.unit.toLowerCase();
  
  // Convert lbs to kg for display
  if ((lowerUnit === "lbs" || lowerUnit === "pounds") && isMetric) {
    return {
      ...row,
      targetValue: row.targetValue ? Number((row.targetValue * 0.45359237).toFixed(1)) : row.targetValue,
      currentValue: row.currentValue ? Number((row.currentValue * 0.45359237).toFixed(1)) : row.currentValue,
      unit: "kg",
    };
  }
  // Convert kg to lbs for display
  if (lowerUnit === "kg" && !isMetric) {
    return {
      ...row,
      targetValue: row.targetValue ? Number((row.targetValue * 2.20462).toFixed(1)) : row.targetValue,
      currentValue: row.currentValue ? Number((row.currentValue * 2.20462).toFixed(1)) : row.currentValue,
      unit: "lbs",
    };
  }
  // Convert mi to km for display
  if ((lowerUnit === "mi" || lowerUnit === "miles") && isMetric) {
    return {
      ...row,
      targetValue: row.targetValue ? Number((row.targetValue * 1.609344).toFixed(2)) : row.targetValue,
      currentValue: row.currentValue ? Number((row.currentValue * 1.609344).toFixed(2)) : row.currentValue,
      unit: "km",
    };
  }
  // Convert km to mi for display
  if (lowerUnit === "km" && !isMetric) {
    return {
      ...row,
      targetValue: row.targetValue ? Number((row.targetValue * 0.621371).toFixed(2)) : row.targetValue,
      currentValue: row.currentValue ? Number((row.currentValue * 0.621371).toFixed(2)) : row.currentValue,
      unit: "mi",
    };
  }
  // Convert oz to ml for display
  if ((lowerUnit === "oz" || lowerUnit === "ounces") && isMetric) {
    return {
      ...row,
      targetValue: row.targetValue ? Math.round(row.targetValue * 29.5735) : row.targetValue,
      currentValue: row.currentValue ? Math.round(row.currentValue * 29.5735) : row.currentValue,
      unit: "ml",
    };
  }
  // Convert ml to oz for display
  if (lowerUnit === "ml" && !isMetric) {
    return {
      ...row,
      targetValue: row.targetValue ? Number((row.targetValue * 0.033814).toFixed(1)) : row.targetValue,
      currentValue: row.currentValue ? Number((row.currentValue * 0.033814).toFixed(1)) : row.currentValue,
      unit: "oz",
    };
  }
  return row;
};

const getTransformSave = (unitPreference) => (payload) => {
  const isMetric = unitPreference === "metric";
  if (!payload.unit) return payload;
  const lowerUnit = payload.unit.toLowerCase();
  
  // Convert kg back to lbs for storage
  if (lowerUnit === "kg") {
    return {
      ...payload,
      targetValue: payload.targetValue ? Number(payload.targetValue) * 2.20462 : payload.targetValue,
      currentValue: payload.currentValue ? Number(payload.currentValue) * 2.20462 : payload.currentValue,
      unit: "lbs",
    };
  }
  // Convert km back to mi for storage
  if (lowerUnit === "km") {
    return {
      ...payload,
      targetValue: payload.targetValue ? Number(payload.targetValue) * 0.621371 : payload.targetValue,
      currentValue: payload.currentValue ? Number(payload.currentValue) * 0.621371 : payload.currentValue,
      unit: "mi",
    };
  }
  // Convert ml back to oz for storage
  if (lowerUnit === "ml") {
    return {
      ...payload,
      targetValue: payload.targetValue ? Number(payload.targetValue) * 0.033814 : payload.targetValue,
      currentValue: payload.currentValue ? Number(payload.currentValue) * 0.033814 : payload.currentValue,
      unit: "oz",
    };
  }
  return payload;
};


export default function Goals() {
  const { user } = useAuth();
  const unitPreference = user?.unitPreference || "standard";
  const columns = getColumns(unitPreference);
  const formFields = getFormFields(unitPreference);
  const transformRow = getTransformRow(unitPreference);
  const transformSave = getTransformSave(unitPreference);
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Goals</h1>
      <CrudPage title="" api={goalApi} columns={columns} formFields={formFields} defaultRange="all" hideRange={true} transformRow={transformRow} transformSave={transformSave} />
    </div>
  );
}
