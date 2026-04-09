const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const mfa = require("../controllers/mfaController");
const { verifyToken } = require("../middleware/auth");

// Public (login/register) — these get the stricter authLimiter in server.js
router.post("/register", ctrl.register);
router.post("/login", ctrl.login);

// Public password reset
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password", ctrl.resetPassword);

// Public MFA endpoints (used during login before token is issued)
router.post("/mfa/send-otp", mfa.sendOtp);
router.post("/mfa/verify", mfa.verifyLogin);

// Protected (profile/wizard) — normal apiLimiter applied in server.js
router.get("/profile", verifyToken, ctrl.getProfile);
router.put("/profile", verifyToken, ctrl.updateProfile);
router.put("/change-password", verifyToken, ctrl.changePassword);
router.post("/avatar", verifyToken, ctrl.avatarUpload.single("avatar"), ctrl.uploadAvatar);
router.post("/complete-wizard", verifyToken, ctrl.completeWizard);

// Protected MFA management
router.post("/mfa/setup", verifyToken, mfa.setupTotp);
router.post("/mfa/verify-setup", verifyToken, mfa.verifySetup);
router.post("/mfa/enable-otp", verifyToken, mfa.enableOtp);
router.post("/mfa/disable", verifyToken, mfa.disable);

module.exports = router;
