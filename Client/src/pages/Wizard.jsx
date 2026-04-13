import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import { ChevronRight, ChevronLeft, Check, Target } from "lucide-react";

const GOAL_CATEGORIES = [
  {
    key: "activity",
    label: "Activity",
    color: "bg-indigo-100 text-indigo-700",
    suggestion: { title: "Exercise 30 min daily", targetValue: 30, unit: "days", endDays: 30 },
  },
  {
    key: "weight",
    label: "Weight",
    color: "bg-purple-100 text-purple-700",
    suggestion: { title: "Reach target weight", targetValue: 10, unit: "lbs", endDays: 90 },
  },
  {
    key: "sleep",
    label: "Sleep",
    color: "bg-blue-100 text-blue-700",
    suggestion: { title: "Sleep 8 hours nightly", targetValue: 30, unit: "nights", endDays: 30 },
  },
  {
    key: "nutrition",
    label: "Nutrition",
    color: "bg-green-100 text-green-700",
    suggestion: { title: "Stay under 2000 cal/day", targetValue: 30, unit: "days", endDays: 30 },
  },
  {
    key: "hydration",
    label: "Hydration",
    color: "bg-cyan-100 text-cyan-700",
    suggestion: { title: "Drink 64 oz water daily", targetValue: 30, unit: "days", endDays: 30 },
  },
  {
    key: "blood_pressure",
    label: "Blood Pressure",
    color: "bg-red-100 text-red-700",
    suggestion: { title: "Keep BP under 130/85", targetValue: 30, unit: "days", endDays: 30 },
  },
  {
    key: "blood_glucose",
    label: "Blood Glucose",
    color: "bg-amber-100 text-amber-700",
    suggestion: { title: "Maintain fasting glucose < 100", targetValue: 30, unit: "days", endDays: 30 },
  },
  {
    key: "heart_rate",
    label: "Heart Rate",
    color: "bg-pink-100 text-pink-700",
    suggestion: { title: "Maintain resting HR under 75 bpm", targetValue: 30, unit: "days", endDays: 30 },
  },
  {
    key: "journal",
    label: "Journal",
    color: "bg-amber-100 text-amber-700",
    suggestion: { title: "Journal at least 1 time a day", targetValue: 30, unit: "days", endDays: 30 },
  },
];

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Wizard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0 = profile, 1 = goals, 2 = review
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Profile form
  const [profile, setProfile] = useState({
    name: user?.name || "",
    age: "",
    weight: "",
    weightUnit: "lbs",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  // Goals — one per category, pre-filled with suggestions
  const [goals, setGoals] = useState(
    GOAL_CATEGORIES.map((cat) => ({
      category: cat.key,
      enabled: true,
      title: cat.suggestion.title,
      targetValue: cat.suggestion.targetValue,
      currentValue: 0,
      unit: cat.suggestion.unit,
      startDate: today(),
      endDate: futureDate(cat.suggestion.endDays),
    }))
  );

  const updateGoal = (idx, field, value) => {
    setGoals((prev) => prev.map((g, i) => (i === idx ? { ...g, [field]: value } : g)));
  };

  useEffect(() => {
    authApi.getProfile().then((r) => {
      const u = r.data;
      setProfile((prev) => ({
        ...prev,
        name: u.name || prev.name,
        age: u.age || prev.age,
        weight: u.weight || prev.weight,
        weightUnit: u.weightUnit || prev.weightUnit,
      }));
    }).catch(() => {});
  }, []);

  const pSet = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });

  const canProceed = () => {
    if (step === 0) return profile.name && profile.age && profile.weight;
    if (step === 1) return goals.some((g) => g.enabled);
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        profile: {
          name: profile.name,
          age: Number(profile.age),
          weight: Number(profile.weight),
          weightUnit: profile.weightUnit,
          address: { street: profile.street, city: profile.city, state: profile.state, zip: profile.zip },
        },
        goals: goals
          .filter((g) => g.enabled)
          .map((g) => ({
            title: g.title,
            category: g.category === "blood_pressure" || g.category === "glucose" || g.category === "heart_rate" ? "other" : g.category,
            targetValue: Number(g.targetValue),
            currentValue: Number(g.currentValue),
            unit: g.unit,
            startDate: g.startDate,
            endDate: g.endDate,
          })),
      };

      const { data } = await authApi.completeWizard(payload);
      localStorage.setItem("token", data.token);
      updateUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">Welcome, {profile.name || "there"}!</h1>
          <p className="text-gray-500 mt-1">Let's set up your wellness profile and goals</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Profile", "Goals", "Review"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i < step ? "bg-indigo-600 text-white" : i === step ? "bg-indigo-600 text-white ring-4 ring-indigo-200" : "bg-gray-200 text-gray-500"
              }`}>
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${i === step ? "text-indigo-700" : "text-gray-400"}`}>{label}</span>
              {i < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

          {/* Step 0: Profile */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name" value={profile.name} onChange={pSet("name")} required />
                <Field label="Email" value={user?.email} readOnly />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Age" value={profile.age} onChange={pSet("age")} type="number" min={1} max={150} required />
                <Field label="Weight" value={profile.weight} onChange={pSet("weight")} type="number" min={50} max={800} step="0.1" required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={profile.weightUnit} onChange={pSet("weightUnit")} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              <hr className="my-2" />
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Address (optional)</h3>
              <Field label="Street" value={profile.street} onChange={pSet("street")} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="City" value={profile.city} onChange={pSet("city")} />
                <Field label="State" value={profile.state} onChange={pSet("state")} />
                <Field label="Zip" value={profile.zip} onChange={pSet("zip")} />
              </div>
            </div>
          )}

          {/* Step 1: Goals */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-1">Set Your Goals</h2>
              <p className="text-sm text-gray-500 mb-4">Enable at least one goal per area. Customize the targets to fit your needs.</p>
              <div className="space-y-3 max-h-[55vh] overflow-auto pr-2">
                {GOAL_CATEGORIES.map((cat, idx) => {
                  const g = goals[idx];
                  return (
                    <div key={cat.key} className={`border rounded-xl p-4 transition ${g.enabled ? "border-indigo-300 bg-indigo-50/30" : "border-gray-200 opacity-60"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.color}`}>{cat.label}</span>
                          <Target size={14} className="text-gray-400" />
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={g.enabled} onChange={(e) => updateGoal(idx, "enabled", e.target.checked)} className="rounded" />
                          Enable
                        </label>
                      </div>
                      {g.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <input
                              value={g.title}
                              onChange={(e) => updateGoal(idx, "title", e.target.value)}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="Goal title"
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={g.targetValue}
                              onChange={(e) => updateGoal(idx, "targetValue", e.target.value)}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="Target"
                              min={1}
                            />
                            <input
                              value={g.unit}
                              onChange={(e) => updateGoal(idx, "unit", e.target.value)}
                              className="w-20 border rounded-lg px-2 py-2 text-sm"
                              placeholder="unit"
                            />
                          </div>
                          <DatePicker
                            selected={g.endDate ? new Date(g.endDate) : null}
                            onChange={(d) => updateGoal(idx, "endDate", d ? d.toISOString() : "")}
                            showTimeSelect
                            dateFormat="MMMM d, yyyy h:mm aa"
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            placeholderText="Select end date & time"
                            withPortal
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Review & Confirm</h2>
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <p><span className="font-medium">Name:</span> {profile.name}</p>
                <p><span className="font-medium">Age:</span> {profile.age}</p>
                <p><span className="font-medium">Weight:</span> {profile.weight} {profile.weightUnit}</p>
                {profile.city && <p><span className="font-medium">Location:</span> {profile.city}{profile.state ? `, ${profile.state}` : ""}</p>}
              </div>
              <h3 className="font-semibold text-sm text-gray-600 uppercase mt-4">Goals ({goals.filter((g) => g.enabled).length})</h3>
              <div className="space-y-2">
                {goals.filter((g) => g.enabled).map((g, i) => {
                  const cat = GOAL_CATEGORIES.find((c) => c.key === g.category);
                  return (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                        <span>{g.title}</span>
                      </div>
                      <span className="text-gray-500">{g.targetValue} {g.unit} by {g.endDate}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border hover:bg-gray-50">
                <ChevronLeft size={16} /> Back
              </button>
            ) : <div />}

            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1 text-sm font-medium bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1 text-sm font-medium bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Complete Setup"} <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, readOnly, required, type = "text", ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm ${readOnly ? "bg-gray-50" : ""}`}
        {...rest}
      />
    </div>
  );
}
