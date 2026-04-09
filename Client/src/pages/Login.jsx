import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import { ShieldCheck } from "lucide-react";

export default function Login() {
  const { login, completeMfaLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // MFA state
  const [mfa, setMfa] = useState(null); // { userId, mfaMethod }
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result.mfaRequired) {
        setMfa({ userId: result.userId, mfaMethod: result.mfaMethod });
        // Auto-send OTP for email/sms
        if (result.mfaMethod !== "totp") {
          await authApi.mfaSendOtp({ userId: result.userId });
          setOtpSent(true);
        }
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
    setLoading(false);
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.mfaVerify({ userId: mfa.userId, token: code });
      completeMfaLogin(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError("");
    try {
      await authApi.mfaSendOtp({ userId: mfa.userId });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend code");
    }
  };

  // MFA verification screen
  if (mfa) {
    const methodLabel = mfa.mfaMethod === "totp" ? "authenticator app" : mfa.mfaMethod;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <ShieldCheck size={48} className="text-indigo-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-800">Two-Factor Authentication</h1>
            <p className="text-gray-500 mt-1">Enter the code from your {methodLabel}</p>
          </div>
          <form onSubmit={handleMfaVerify} className="bg-white rounded-xl shadow-sm border p-8 space-y-5">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
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
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            {mfa.mfaMethod !== "totp" && (
              <p className="text-center text-sm text-gray-500">
                Didn't get the code?{" "}
                <button type="button" onClick={handleResend} className="text-indigo-600 hover:underline font-medium">Resend</button>
              </p>
            )}
            <button type="button" onClick={() => { setMfa(null); setCode(""); setError(""); }} className="w-full text-sm text-gray-500 hover:text-gray-700">
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">WellnessTracker</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-8 space-y-5">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
              required
              minLength={6}
            />
            <div className="text-right mt-1">
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">Forgot password?</Link>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 hover:underline font-medium">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
