# WellnessTracker Client

React single-page application for the WellnessTracker platform.

## Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS
- **Charts**: Recharts (LineChart, BarChart, PieChart)
- **Icons**: Lucide React
- **Date Picker**: react-datepicker
- **HTTP Client**: Axios with 30-second GET cache and automatic cache invalidation on mutations

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:3000` and proxies `/api` requests to `http://localhost:5000`.

## Project Structure

```
Client/src/
├── api.js                      # Axios instance, resource APIs, request caching
├── App.jsx                     # Router + protected routes
├── main.jsx                    # Entry point
├── index.css                   # Tailwind imports
├── components/
│   ├── CrudPage.jsx            # Generic paginated CRUD table with search, sort, modal form, error handling
│   └── Layout.jsx              # App shell: sidebar navigation, header with avatar dropdown
├── context/
│   └── AuthContext.jsx         # JWT auth state, login/register/MFA, user preferences
├── pages/
│   ├── Dashboard.jsx           # Stat cards + 7 weekly trend charts + goal progress pie
│   ├── Activities.jsx          # Activity log with unit conversion (mi/km), calorie estimation
│   ├── Meals.jsx               # Meal tracking with calorie/protein stats
│   ├── SleepPage.jsx           # Sleep log with duration chart
│   ├── Vitals.jsx              # Tabbed: Blood Pressure, Glucose, Heart Rate, Weight
│   ├── WaterIntake.jsx         # Hydration tracking with daily/period goals
│   ├── Journal.jsx             # Mood journaling with trend chart
│   ├── Goals.jsx               # Goal management with unit-aware transforms
│   ├── Login.jsx               # Login + MFA challenge flow
│   ├── Register.jsx            # Registration form
│   ├── Profile.jsx             # Edit profile + avatar upload
│   ├── Account.jsx             # Change password, unit prefs, MFA management
│   ├── ForgotPassword.jsx      # Password reset request
│   └── Wizard.jsx              # Onboarding wizard (profile + goals)
└── utils/
    ├── dateRanges.js           # RANGES, getDateRange(), getPeriodInfo()
    └── unitConversion.js       # convertWeight, convertDistance, convertVolume + unit getters
```

## Key Components

### CrudPage

Reusable data management component used by most pages. Features:

- **Pagination** — Configurable page sizes (10, 20, 50)
- **Search** — Debounced text search
- **Sorting** — Click column headers to toggle sort direction
- **Date range filtering** — Range pills (This Week, Last Week, Month, Year, All Time)
- **Modal form** — Dynamic form fields with date picker support
- **Error handling** — Inline error banners for save/delete failures with try/catch
- **Row transforms** — `transformRow` for display-time unit conversion, `transformSave` for storage-time conversion

Props: `api`, `columns`, `formFields`, `range`, `onRangeChange`, `hideRange`, `hideAdd`, `hideDelete`, `transformRow`, `transformSave`, `renderExtra`, `defaultRange`

### Shared Utilities

- **`getPeriodInfo(range, rows)`** — Returns `{ label, daysInPeriod }` for any range key. Used across Activities, Sleep, Meals, Vitals, WaterIntake, and Journal pages to eliminate ~180 lines of duplicated if/else chains.
- **`getDateRange(key)`** — Returns `{ fromDate, toDate }` ISO strings for API queries.
- **Unit conversion** — All data is stored in standard units (lbs, oz, mi) and converted for display based on `user.unitPreference`. The conversion functions (`convertWeight`, `convertDistance`, `convertVolume`) handle bidirectional conversion.

### API Client

`api.js` provides:
- Axios instance with JWT `Authorization` header injection
- 30-second GET response cache with automatic invalidation on POST/PUT/PATCH/DELETE
- Auto-redirect to `/login` on 401 responses
- Resource factory: each API (`activityApi`, `mealApi`, etc.) exposes `getAll`, `getById`, `create`, `update`, `remove`

## Build

```bash
npm run build
```

Output is placed in `../Server/public/` for the Express server to serve as a static SPA.
