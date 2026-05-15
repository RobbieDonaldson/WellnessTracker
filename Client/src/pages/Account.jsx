import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import { Settings, Lock, ShieldCheck, Smartphone, Mail, Key } from "lucide-react";

export default function Account() {
  const { user, updateUser } = useAuth();

  // Password change
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethod, setMfaMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [mfaMsg, setMfaMsg] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaPassword, setMfaPassword] = useState("");

  // Unit preference state
  const [unitPreference, setUnitPreference] = useState("standard");
  const [unitMsg, setUnitMsg] = useState("");
  const [unitSaving, setUnitSaving] = useState(false);

  // TOTP setup
  const [totpSetup, setTotpSetup] = useState(null); // { qrCode, secret }
  const [totpToken, setTotpToken] = useState("");

  useEffect(() => {
    authApi.getProfile().then((r) => {
      setMfaEnabled(r.data.mfaEnabled || false);
      setMfaMethod(r.data.mfaMethod || "");
      setPhone(r.data.phone || "");
      setUnitPreference(r.data.unitPreference || "standard");
    }).catch(() => {});
  }, []);

  // --- Change Password ---
  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwMsg("");
    if (pw.newPassword !== pw.confirm) return setPwMsg("New passwords do not match.");
    setPwSaving(true);
    try {
      const { data } = await authApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPwMsg(data.message);
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPwMsg(err.response?.data?.error || "Failed to change password.");
    }
    setPwSaving(false);
  };

  // --- Unit Preference ---
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    setUnitMsg("");
    setUnitSaving(true);
    try {
      const { data } = await authApi.updateProfile({ unitPreference });
      updateUser({ ...user, unitPreference });
      setUnitMsg("Unit preference updated successfully.");
    } catch (err) {
      setUnitMsg(err.response?.data?.error || "Failed to update unit preference.");
    }
    setUnitSaving(false);
  };

  // --- MFA: Enable TOTP ---
  const startTotpSetup = async () => {
    setMfaMsg("");
    setMfaLoading(true);
    try {
      const { data } = await authApi.mfaSetupTotp();
      setTotpSetup(data);
    } catch (err) {
      setMfaMsg(err.response?.data?.error || "Setup failed.");
    }
    setMfaLoading(false);
  };

  const confirmTotpSetup = async () => {
    setMfaMsg("");
    setMfaLoading(true);
    try {
      const { data } = await authApi.mfaVerifySetup({ token: totpToken, method: "totp" });
      setMfaEnabled(true);
      setMfaMethod("totp");
      setTotpSetup(null);
      setTotpToken("");
      setMfaMsg(data.message);
    } catch (err) {
      setMfaMsg(err.response?.data?.error || "Invalid code.");
    }
    setMfaLoading(false);
  };

  // --- MFA: Enable Email/SMS ---
  const enableOtpMethod = async (method) => {
    setMfaMsg("");
    if (method === "sms" && !phone.trim()) return setMfaMsg("Enter a phone number first.");
    setMfaLoading(true);
    try {
      const { data } = await authApi.mfaEnableOtp({ method, phone: phone.trim() });
      setMfaEnabled(true);
      setMfaMethod(method);
      setMfaMsg(data.message);
    } catch (err) {
      setMfaMsg(err.response?.data?.error || "Failed.");
    }
    setMfaLoading(false);
  };

  // --- MFA: Disable ---
  const disableMfa = async () => {
    setMfaMsg("");
    if (!mfaPassword) return setMfaMsg("Enter your password to disable MFA.");
    setMfaLoading(true);
    try {
      const { data } = await authApi.mfaDisable({ password: mfaPassword });
      setMfaEnabled(false);
      setMfaMethod("");
      setTotpSetup(null);
      setMfaPassword("");
      setMfaMsg(data.message);
    } catch (err) {
      setMfaMsg(err.response?.data?.error || "Failed.");
    }
    setMfaLoading(false);
  };

  const methodLabel = { totp: "Authenticator App", email: "Email", sms: "SMS" };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Settings size={28} className="text-indigo-600" /> Account Settings
      </h1>

      <div className="max-w-2xl space-y-8">
        {/* Unit Preference */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Settings size={20} /> Unit Preference</h2>
          {unitMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${unitMsg.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {unitMsg}
            </div>
          )}
          <form onSubmit={handleUnitSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Units</label>
              <select value={unitPreference} onChange={(e) => setUnitPreference(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                <option value="standard">Standard (lbs, ft, oz)</option>
                <option value="metric">Metric (kg, m, ml)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">This will affect how units are displayed across the application.</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={unitSaving} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                {unitSaving ? "Saving..." : "Save Preference"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Lock size={20} /> Change Password</h2>
          {pwMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${pwMsg.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {pwMsg}
            </div>
          )}
          <form onSubmit={handlePwSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm" required minLength={6} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm" required minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm" required minLength={6} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwSaving} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                {pwSaving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>

        {/* MFA Management */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><ShieldCheck size={20} /> Two-Factor Authentication</h2>

          {mfaMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${mfaMsg.toLowerCase().includes("enabled") || mfaMsg.toLowerCase().includes("disabled") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {mfaMsg}
            </div>
          )}

          {mfaEnabled ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">MFA is enabled via {methodLabel[mfaMethod] || mfaMethod}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Enter your password to disable MFA</label>
                    <input
                      type="password"
                      value={mfaPassword}
                      onChange={(e) => setMfaPassword(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Current password"
                      minLength={6}
                    />
                  </div>
                  <button onClick={disableMfa} disabled={mfaLoading} className="text-sm text-red-600 hover:underline font-medium">
                    {mfaLoading ? "Disabling..." : "Disable"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">Choose a method to secure your account:</p>

              {/* Google Authenticator / TOTP */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Key size={18} className="text-indigo-600" />
                    <span className="text-sm font-semibold">Authenticator App</span>
                  </div>
                  {!totpSetup && (
                    <button onClick={startTotpSetup} disabled={mfaLoading} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      Set Up
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-2">Use Google Authenticator, Authy, or similar apps.</p>
                {totpSetup && (
                  <div className="space-y-3 mt-3">
                    <div className="flex justify-center">
                      <img src={totpSetup.qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Can't scan? Enter manually: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{totpSetup.secret}</code>
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={totpToken}
                        onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                      />
                      <button onClick={confirmTotpSetup} disabled={mfaLoading || totpToken.length < 6} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                        Verify
                      </button>
                    </div>
                    <button onClick={() => { setTotpSetup(null); setTotpToken(""); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-indigo-600" />
                  <div>
                    <span className="text-sm font-semibold">Email</span>
                    <p className="text-xs text-gray-400">Code sent to {user?.email}</p>
                  </div>
                </div>
                <button onClick={() => enableOtpMethod("email")} disabled={mfaLoading} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  Enable
                </button>
              </div>

              {/* SMS */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone size={18} className="text-indigo-600" />
                    <span className="text-sm font-semibold">SMS Text</span>
                  </div>
                  <button onClick={() => enableOtpMethod("sms")} disabled={mfaLoading} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    Enable
                  </button>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Phone number (e.g. +15551234567)"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
