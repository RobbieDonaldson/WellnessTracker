const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const isProd = process.env.NODE_ENV === "production";

const connectDB = require("./config/db");

// Route imports
const activityRoutes = require("./routes/activityRoutes");
const mealRoutes = require("./routes/mealRoutes");
const sleepRoutes = require("./routes/sleepRoutes");
const goalRoutes = require("./routes/goalRoutes");
const bloodPressureRoutes = require("./routes/bloodPressureRoutes");
const bloodGlucoseRoutes = require("./routes/bloodGlucoseRoutes");
const heartRateRoutes = require("./routes/heartRateRoutes");
const weightRoutes = require("./routes/weightRoutes");
const authRoutes = require("./routes/authRoutes");
const waterIntakeRoutes = require("./routes/waterIntakeRoutes");
const { verifyToken } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: isProd ? undefined : false, // disable CSP in dev for Vite HMR
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());
app.use(
  cors({
    origin(origin, cb) {
      // allow server-to-server (no origin) and allowed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});

// Logging — concise in prod, verbose in dev
app.use(morgan(isProd ? "combined" : "dev"));

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// View engine (EJS) — for any server-rendered pages
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Auth routes — stricter limit on login/register, normal limit on profile/wizard
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", apiLimiter, authRoutes);

// Protected routes (standard rate limit)
app.use("/api/activities", apiLimiter, verifyToken, activityRoutes);
app.use("/api/meals", apiLimiter, verifyToken, mealRoutes);
app.use("/api/sleep", apiLimiter, verifyToken, sleepRoutes);
app.use("/api/goals", apiLimiter, verifyToken, goalRoutes);
app.use("/api/blood-pressure", apiLimiter, verifyToken, bloodPressureRoutes);
app.use("/api/blood-glucose", apiLimiter, verifyToken, bloodGlucoseRoutes);
app.use("/api/heart-rate", apiLimiter, verifyToken, heartRateRoutes);
app.use("/api/weight", apiLimiter, verifyToken, weightRoutes);
app.use("/api/water-intake", apiLimiter, verifyToken, waterIntakeRoutes);

// ---------------------------------------------------------------------------
// SPA fallback — serve React app for all non-API routes in production
// ---------------------------------------------------------------------------
const clientIndex = path.join(__dirname, "public", "index.html");

if (fs.existsSync(clientIndex)) {
  app.get("*", (req, res, next) => {
    // Don't catch API routes
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(clientIndex);
  });
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use((req, res) => {
  // API 404
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Route not found" });
  }
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;

  // Log full error server-side
  if (status >= 500) console.error(err.stack);
  else console.warn(`${status} — ${err.message}`);

  // Never leak stack traces or internal details in production
  res.status(status).json({
    error: isProd && status >= 500
      ? "An unexpected error occurred. Please try again later."
      : err.message || "Unknown error",
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
