const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

// Public (login/register) — these get the stricter authLimiter in server.js
router.post("/register", ctrl.register);
router.post("/login", ctrl.login);

// Protected (profile/wizard) — normal apiLimiter applied in server.js
router.get("/profile", verifyToken, ctrl.getProfile);
router.put("/profile", verifyToken, ctrl.updateProfile);
router.post("/avatar", verifyToken, ctrl.avatarUpload.single("avatar"), ctrl.uploadAvatar);
router.post("/complete-wizard", verifyToken, ctrl.completeWizard);

module.exports = router;
