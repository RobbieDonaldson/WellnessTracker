# WellnessTracker Server

Express + MongoDB backend API for the WellnessTracker application.

## Tech Stack

- **Runtime**: Node.js 22 LTS
- **Framework**: Express 4.21
- **Database**: MongoDB with Mongoose 8.9 ODM
- **Auth**: JSON Web Tokens (7-day expiry), bcrypt password hashing
- **MFA**: TOTP (speakeasy), Email OTP, SMS OTP
- **Security**: Helmet, CORS, express-rate-limit, input sanitization
- **Architecture**: MVC (Models → Controllers → Routes)

## Prerequisites

- Node.js 22+ installed
- MongoDB running locally on port 27017 (or update `MONGO_URI` in `.env`)

## Getting Started

```bash
# Install dependencies
npm install

# Start in development (with auto-reload)
npm run dev

# Start in production
npm start
```

The server starts on `http://localhost:5000` by default.

## Project Structure

```
Server/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   ├── authController.js        # Register, login, profile, password reset, avatar
│   ├── mfaController.js         # TOTP setup, OTP send/verify, MFA enable/disable
│   ├── activityController.js
│   ├── bloodGlucoseController.js
│   ├── bloodPressureController.js
│   ├── goalController.js        # CRUD + auto-computed progress
│   ├── heartRateController.js
│   ├── journalController.js
│   ├── mealController.js
│   ├── sleepController.js
│   ├── waterIntakeController.js
│   └── weightController.js
├── middleware/
│   └── auth.js                  # JWT verification, role-based access
├── models/
│   ├── User.js                  # User profile, MFA fields, password hashing
│   ├── Activity.js
│   ├── BloodGlucose.js
│   ├── BloodPressure.js
│   ├── Goal.js
│   ├── HeartRate.js
│   ├── Journal.js
│   ├── Meal.js
│   ├── Sleep.js                 # Pre-save hook: auto-calculates duration, validates wakeTime > bedtime
│   ├── WaterIntake.js
│   └── Weight.js
├── routes/
│   ├── authRoutes.js            # Auth + MFA endpoints
│   ├── activityRoutes.js
│   ├── bloodGlucoseRoutes.js
│   ├── bloodPressureRoutes.js
│   ├── goalRoutes.js
│   ├── heartRateRoutes.js
│   ├── journalRoutes.js
│   ├── mealRoutes.js
│   ├── sleepRoutes.js
│   ├── waterIntakeRoutes.js
│   └── weightRoutes.js
├── utils/
│   └── queryHelper.js           # Pagination, search (regex-escaped), sort validation, date range filtering
├── public/
│   └── avatars/                 # Uploaded user avatars
├── views/
│   └── index.ejs
├── package.json
├── README.md
└── server.js                    # Entry point, middleware, rate limiters
```

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/auth/register` | No | authLimiter (50/15m) | Register a new user |
| POST | `/api/auth/login` | No | authLimiter (50/15m) | Login (returns JWT or MFA challenge) |
| GET | `/api/auth/profile` | JWT | apiLimiter | Get current user profile |
| PUT | `/api/auth/profile` | JWT | apiLimiter | Update profile (name, age, weight, units) |
| PUT | `/api/auth/change-password` | JWT | apiLimiter | Change password |
| POST | `/api/auth/avatar` | JWT | apiLimiter | Upload profile avatar (jpg/png/gif/webp, 2MB max) |
| POST | `/api/auth/forgot-password` | No | apiLimiter | Request password reset code |
| POST | `/api/auth/reset-password` | No | apiLimiter | Reset password with code |
| POST | `/api/auth/complete-wizard` | JWT | apiLimiter | Complete onboarding wizard |

### Multi-Factor Authentication

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/auth/mfa/setup` | JWT | apiLimiter | Generate TOTP secret + QR code |
| POST | `/api/auth/mfa/verify-setup` | JWT | apiLimiter | Verify first TOTP token to enable |
| POST | `/api/auth/mfa/enable-otp` | JWT | apiLimiter | Enable email or SMS MFA |
| POST | `/api/auth/mfa/disable` | JWT | apiLimiter | Disable MFA |
| POST | `/api/auth/mfa/send-otp` | No | mfaLimiter (10/15m) | Send OTP via email/SMS |
| POST | `/api/auth/mfa/verify` | No | mfaLimiter (10/15m) | Verify OTP/TOTP during login |

### Data Resources (all require JWT)

Each resource supports: `GET /` (list, paginated), `POST /` (create), `GET /:id`, `PUT /:id`, `DELETE /:id`

| Resource | Endpoint | Search Fields |
|----------|----------|---------------|
| Activities | `/api/activities` | name, type, notes |
| Meals | `/api/meals` | name, mealType, notes |
| Sleep | `/api/sleep` | quality, notes |
| Goals | `/api/goals` | title, category, unit |
| Blood Pressure | `/api/blood-pressure` | notes |
| Blood Glucose | `/api/blood-glucose` | measurementType, notes |
| Heart Rate | `/api/heart-rate` | notes |
| Weight | `/api/weight` | notes |
| Water Intake | `/api/water-intake` | notes |
| Journal | `/api/journal` | title, mood, tags |

### Query Parameters (all list endpoints)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | `1` | Page number (1-indexed) |
| `limit` | `20` | Items per page (max 100) |
| `sort` | `-date` | Sort field (prefix `-` for descending) |
| `search` | — | Text search across configured fields (regex-escaped) |
| `fromDate` | — | ISO date, inclusive lower bound |
| `toDate` | — | ISO date, inclusive upper bound |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Returns `{ status: "ok", uptime }` |

## Security Features

- **JWT expiry**: All tokens expire after 7 days
- **JWT_SECRET enforcement**: App crashes on startup in production if `JWT_SECRET` env var is not set
- **Search sanitization**: User search input is regex-escaped to prevent ReDoS attacks
- **Sort validation**: Sort field names are validated against `[a-zA-Z0-9_.]` whitelist
- **Avatar upload validation**: Both file extension and MIME type are checked (jpg, png, gif, webp only)
- **MFA rate limiting**: Dedicated rate limiter (10 requests/15 minutes) on OTP send and verify endpoints
- **MFA anti-enumeration**: `send-otp` returns generic success regardless of whether userId is valid
- **OTP comparison**: Timing-safe comparison (`crypto.timingSafeEqual`) prevents side-channel attacks
- **API cache invalidation**: Client-side request cache is cleared after any mutation (POST/PUT/PATCH/DELETE)
- **Goal optimization**: Completed past goals and future goals skip expensive progress recomputation

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode (`production` enforces JWT_SECRET) |
| `MONGO_URI` | `mongodb://localhost:27017/wellnesstracker` | MongoDB connection string |
| `JWT_SECRET` | dev fallback | **Required in production.** Random secret for signing JWTs |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `API_RATE_LIMIT` | `500` | Max API requests per 15-minute window |
| `AUTH_RATE_LIMIT` | `50` | Max auth requests per 15-minute window |
