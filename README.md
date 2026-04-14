# WellnessTracker

A full-stack wellness tracking application for monitoring health metrics, setting goals, and visualizing progress.

## Features

- **Dashboard** — At-a-glance stat cards and weekly trend charts for all health metrics
- **Activities** — Log workouts with duration, distance, calories; supports unit conversion (mi/km, lbs/kg)
- **Meals** — Track meals with calories, protein, and meal type
- **Sleep** — Record bedtime/wake time with auto-calculated duration and quality rating
- **Vitals** — Track blood pressure, blood glucose, heart rate, and weight in a tabbed interface
- **Water Intake** — Daily hydration tracking with daily/period goals
- **Journal** — Mood journaling with mood trend visualization
- **Goals** — Set goals for any category with auto-computed progress from tracked data
- **Unit Preferences** — Toggle between standard (lbs, oz, mi) and metric (kg, ml, km) system-wide
- **Multi-Factor Auth** — TOTP (Google Authenticator), Email OTP, or SMS OTP
- **Onboarding Wizard** — Guided setup for new users (profile + initial goals)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TailwindCSS, Recharts, Lucide icons, React DatePicker |
| **Backend** | Node.js 22, Express 4.21, Mongoose 8.9 |
| **Database** | MongoDB |
| **Auth** | JWT (7-day expiry), bcrypt, speakeasy (TOTP) |
| **Security** | Helmet, CORS, express-rate-limit (3 tiers), input sanitization |

## Project Structure

```
WellnessTracker/
├── Client/                  # React SPA
│   └── src/
│       ├── components/      # Reusable components (CrudPage, Layout)
│       ├── context/         # AuthContext (JWT + user state)
│       ├── pages/           # Route pages (Dashboard, Activities, Vitals, etc.)
│       ├── utils/           # dateRanges (getPeriodInfo, getDateRange), unitConversion
│       └── api.js           # Axios instance with caching + cache invalidation on mutations
├── Server/                  # Express API
│   ├── controllers/         # Route handlers (auth, MFA, 10 data resources)
│   ├── middleware/          # JWT verification, role-based access
│   ├── models/              # Mongoose schemas (11 models)
│   ├── routes/              # Express route definitions
│   └── utils/               # queryHelper (pagination, search, sort validation)
└── deploy/                  # Production deployment (PM2, Nginx, setup script)
```

## Quick Start

### Prerequisites

- Node.js 22+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Start the server

```bash
cd Server
npm install
npm run dev
```

Server runs at `http://localhost:5000`.

### 2. Start the client

```bash
cd Client
npm install
npm run dev
```

Client runs at `http://localhost:3000`.

### 3. Open the app

Navigate to `http://localhost:3000`. Register a new account and complete the onboarding wizard.

## Environment Variables

Create `Server/.env` for local development (all have sensible defaults in dev mode):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/wellnesstracker
CLIENT_ORIGIN=http://localhost:3000
```

For production, see the [Deployment Guide](deploy/README.md). `JWT_SECRET` is **required** in production — the server will refuse to start without it.

## Security

The application includes multiple layers of security:

- **JWT tokens** — 7-day expiry; `JWT_SECRET` enforced in production
- **Rate limiting** — Three tiers: API (500/15m), auth (50/15m), MFA (10/15m)
- **Input sanitization** — Search queries are regex-escaped; sort fields validated against whitelist
- **Upload validation** — Avatar uploads checked by both file extension and MIME type
- **MFA hardening** — Timing-safe OTP comparison, anti-enumeration on send-otp endpoint
- **Cache coherence** — Client-side GET cache cleared automatically after any mutation

## Key Client Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `getPeriodInfo(range, rows)` | `utils/dateRanges.js` | Compute period label and days-in-period from a range key |
| `getDateRange(key)` | `utils/dateRanges.js` | Convert range key to `{ fromDate, toDate }` ISO strings |
| `convertWeight/Distance/Volume` | `utils/unitConversion.js` | Bi-directional unit conversion for display and storage |
| `CrudPage` | `components/CrudPage.jsx` | Generic paginated data table with search, sort, form modal, error handling |

## Documentation

- **User Guide** — [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- **Server API** — [Server/README.md](Server/README.md)
- **Deployment** — [deploy/README.md](deploy/README.md)
