const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");
const User = require("../models/User");

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

// POST /api/auth/mfa/setup — start TOTP setup, returns QR + secret
exports.setupTotp = async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({ name: `WellnessTracker (${req.user.email})`, length: 20 });
    // Save temp secret (not yet verified)
    await User.findByIdAndUpdate(req.user.id, { totpSecret: secret.base32 });
    const qr = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode: qr });
  } catch (err) { next(err); }
};

// POST /api/auth/mfa/verify-setup — verify first TOTP token to enable
exports.verifySetup = async (req, res, next) => {
  try {
    const { token, method } = req.body;
    const user = await User.findById(req.user.id).select("+totpSecret");
    if (!user) return res.status(404).json({ error: "User not found." });

    if (method === "totp") {
      const valid = speakeasy.totp.verify({ secret: user.totpSecret, encoding: "base32", token, window: 1 });
      if (!valid) return res.status(400).json({ error: "Invalid code. Try again." });
    }

    user.mfaEnabled = true;
    user.mfaMethod = method || "totp";
    await user.save();
    res.json({ message: "MFA enabled.", mfaMethod: user.mfaMethod });
  } catch (err) { next(err); }
};

// POST /api/auth/mfa/enable-otp — enable email or sms MFA
exports.enableOtp = async (req, res, next) => {
  try {
    const { method, phone } = req.body;
    if (!["email", "sms"].includes(method)) return res.status(400).json({ error: "Invalid method." });
    if (method === "sms" && !phone) return res.status(400).json({ error: "Phone number required for SMS." });

    const updates = { mfaEnabled: true, mfaMethod: method };
    if (phone) updates.phone = phone;
    await User.findByIdAndUpdate(req.user.id, updates);
    res.json({ message: `MFA via ${method} enabled.`, mfaMethod: method });
  } catch (err) { next(err); }
};

// POST /api/auth/mfa/disable
exports.disable = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      mfaEnabled: false, mfaMethod: "", totpSecret: "", pendingOtp: "", pendingOtpExpires: null,
    });
    res.json({ message: "MFA disabled." });
  } catch (err) { next(err); }
};

// POST /api/auth/mfa/send-otp — generate and "send" OTP for email/sms (logs in dev)
exports.sendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required." });

    const user = await User.findById(userId);
    if (!user || !user.mfaEnabled) return res.status(400).json({ error: "MFA not configured." });

    const otp = generateOtp();
    user.pendingOtp = otp;
    user.pendingOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await user.save();

    // In production, integrate real email/SMS provider here
    if (user.mfaMethod === "email") {
      console.log(`[MFA] Email OTP for ${user.email}: ${otp}`);
    } else if (user.mfaMethod === "sms") {
      console.log(`[MFA] SMS OTP for ${user.phone}: ${otp}`);
    }

    res.json({ message: "Code sent.", method: user.mfaMethod });
  } catch (err) { next(err); }
};

// POST /api/auth/mfa/verify — verify OTP/TOTP during login
exports.verifyLogin = async (req, res, next) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) return res.status(400).json({ error: "userId and token required." });

    const user = await User.findById(userId).select("+totpSecret +pendingOtp +pendingOtpExpires");
    if (!user || !user.mfaEnabled) return res.status(400).json({ error: "Invalid request." });

    let valid = false;
    if (user.mfaMethod === "totp") {
      valid = speakeasy.totp.verify({ secret: user.totpSecret, encoding: "base32", token, window: 1 });
    } else {
      // email or sms OTP
      valid = user.pendingOtp === token && user.pendingOtpExpires > new Date();
      if (valid) {
        user.pendingOtp = "";
        user.pendingOtpExpires = null;
        await user.save();
      }
    }

    if (!valid) return res.status(401).json({ error: "Invalid or expired code." });

    // Issue JWT
    const jwt = require("jsonwebtoken");
    const { JWT_SECRET } = require("../middleware/auth");
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name, wizardCompleted: user.wizardCompleted },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: jwtToken,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, wizardCompleted: user.wizardCompleted },
    });
  } catch (err) { next(err); }
};
