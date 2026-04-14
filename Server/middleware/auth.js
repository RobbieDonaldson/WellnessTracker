const jwt = require("jsonwebtoken");

const isProd = process.env.NODE_ENV === "production";
if (isProd && !process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable must be set in production.");
}
const JWT_SECRET = process.env.JWT_SECRET || "wellness-tracker-dev-secret-change-in-prod";

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole, JWT_SECRET };
