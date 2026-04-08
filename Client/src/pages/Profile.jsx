import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import { Save, User, Camera } from "lucide-react";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: "", age: "", weight: "", weightUnit: "lbs", email: "", street: "", city: "", state: "", zip: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    authApi.getProfile()
      .then((r) => {
        const u = r.data;
        setForm({
          name: u.name || "",
          age: u.age || "",
          weight: u.weight || "",
          weightUnit: u.weightUnit || "lbs",
          email: u.email || "",
          street: u.address?.street || "",
          city: u.address?.city || "",
          state: u.address?.state || "",
          zip: u.address?.zip || "",
        });
        if (u.avatar) setAvatar(u.avatar);
      })
      .catch((err) => {
        setLoadError(err.response?.data?.error || "Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        weightUnit: form.weightUnit,
        address: { street: form.street, city: form.city, state: form.state, zip: form.zip },
      };
      const { data } = await authApi.updateProfile(payload);
      updateUser({ ...user, name: data.name });
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage(err.response?.data?.error || "Update failed");
    }
    setSaving(false);
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const { data } = await authApi.uploadAvatar(file);
      setAvatar(data.avatar + "?t=" + Date.now());
      updateUser({ ...user, avatar: data.avatar });
      setMessage("Photo updated!");
    } catch (err) {
      setMessage(err.response?.data?.error || "Upload failed");
    }
    setUploading(false);
  };

  if (loading) return <p className="text-gray-400 py-20 text-center">Loading profile...</p>;
  if (loadError) return <p className="text-red-500 py-20 text-center">{loadError}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><User size={28} className="text-indigo-600" /> Profile</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl space-y-5">
        {message && (
          <div className={`text-sm rounded-lg px-4 py-3 ${message.includes("success") || message.includes("updated") || message.includes("Photo") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {message}
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-gray-200">
                <User size={32} className="text-indigo-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
            >
              <Camera size={20} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Profile Photo</p>
            <p className="text-xs text-gray-400">Click photo to change. Max 2 MB.</p>
            {uploading && <p className="text-xs text-indigo-500 mt-1">Uploading...</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={form.name} onChange={set("name")} className="w-full border rounded-lg px-3 py-2.5 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50" readOnly />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input type="number" value={form.age} onChange={set("age")} className="w-full border rounded-lg px-3 py-2.5 text-sm" min={1} max={150} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
            <input type="number" value={form.weight} onChange={set("weight")} className="w-full border rounded-lg px-3 py-2.5 text-sm" min={50} max={800} step="0.1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select value={form.weightUnit} onChange={set("weightUnit")} className="w-full border rounded-lg px-3 py-2.5 text-sm">
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        <hr />
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Address</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
          <input type="text" value={form.street} onChange={set("street")} className="w-full border rounded-lg px-3 py-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" value={form.city} onChange={set("city")} className="w-full border rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input type="text" value={form.state} onChange={set("state")} className="w-full border rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
            <input type="text" value={form.zip} onChange={set("zip")} className="w-full border rounded-lg px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            <Save size={16} /> {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
