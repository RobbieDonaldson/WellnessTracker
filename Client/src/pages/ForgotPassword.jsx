import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { KeyRound, ArrowLeft, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Step 1: request code   Step 2: enter code + new password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword({ email });
      setMsg(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.resetPassword({ email, token: code, newPassword });
      setMsg(data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <KeyRound size={48} className="text-indigo-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-800">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h1>
          <p className="text-gray-500 mt-1">
            {step === 1
              ? "Enter your email and we'll send a reset code"
              : "Enter the code and your new password"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="bg-white rounded-xl shadow-sm border p-8 space-y-5">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
            {msg && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3">{msg}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-1">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleReset} className="bg-white rounded-xl shadow-sm border p-8 space-y-5">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
            {msg && (
              <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <ShieldCheck size={16} /> {msg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm text-center tracking-[0.3em] text-lg font-mono"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => { setStep(1); setError(""); setMsg(""); setCode(""); }} className="text-gray-500 hover:text-gray-700">
                Change email
              </button>
              <button type="button" onClick={handleRequestCode} disabled={loading} className="text-indigo-600 hover:underline font-medium">
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
