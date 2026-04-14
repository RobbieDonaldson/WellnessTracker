const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth");

// Avatar upload config
const AVATAR_DIR = path.join(__dirname, "..", "public", "avatars");
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}${ext}`);
  },
});
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(new Error("Only image files (jpg, png, gif, webp) are allowed."), false);
  }
  cb(null, true);
};
exports.avatarUpload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

const TOKEN_EXPIRY = "7d";

const Goal = require("../models/Goal");

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name, wizardCompleted: user.wizardCompleted },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { email, password, name, age, weight, weightUnit } = req.body;

    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered." });

    const user = await User.create({ email, password, name, age, weight, weightUnit });
    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, wizardCompleted: user.wizardCompleted },
    });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password." });

    // If MFA is enabled, don't issue token yet
    if (user.mfaEnabled && user.mfaMethod) {
      return res.json({
        mfaRequired: true,
        mfaMethod: user.mfaMethod,
        userId: user._id,
      });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, wizardCompleted: user.wizardCompleted },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/complete-wizard
exports.completeWizard = async (req, res, next) => {
  try {
    const { profile, goals } = req.body;

    // Update profile
    const profileUpdates = {};
    ["name", "age", "weight", "weightUnit", "address"].forEach((key) => {
      if (profile[key] !== undefined) profileUpdates[key] = profile[key];
    });
    profileUpdates.wizardCompleted = true;

    const user = await User.findByIdAndUpdate(req.user.id, profileUpdates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ error: "User not found." });

    // Create goals
    if (goals && goals.length) {
      const goalDocs = goals.map((g) => ({ ...g, userId: req.user.id }));
      await Goal.insertMany(goalDocs);
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, wizardCompleted: true },
    });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ["name", "age", "weight", "weightUnit", "address", "unitPreference"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both current and new password are required." });
    if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters." });

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ error: "User not found." });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ error: "Current password is incorrect." });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully." });
  } catch (err) { next(err); }
};

// POST /api/auth/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided." });

    const avatarUrl = `/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found." });

    res.json({ avatar: user.avatar });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to avoid email enumeration
    if (!user) return res.json({ message: "If that email exists, a reset code has been sent." });

    const token = crypto.randomInt(100000, 999999).toString();
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    // In production, send via real email service
    console.log(`[PASSWORD RESET] Code for ${user.email}: ${token}`);

    res.json({ message: "If that email exists, a reset code has been sent." });
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ error: "Email, code, and new password are required." });
    if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetToken +resetTokenExpires");
    if (!user || user.resetToken !== token || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset code." });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset. You can now log in." });
  } catch (err) { next(err); }
};
