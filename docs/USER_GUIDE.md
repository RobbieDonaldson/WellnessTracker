# WellnessTracker User Guide

## Table of Contents

- [Getting Started](#getting-started)
  - [Registration](#registration)
  - [Onboarding Wizard](#onboarding-wizard)
  - [Login](#login)
  - [Forgot Password](#forgot-password)
- [Navigation](#navigation)
- [Dashboard](#dashboard)
- [Activities](#activities)
- [Meals](#meals)
- [Sleep](#sleep)
- [Vitals](#vitals)
  - [Blood Pressure](#blood-pressure)
  - [Blood Glucose](#blood-glucose)
  - [Heart Rate](#heart-rate)
  - [Weight](#weight)
- [Water Intake](#water-intake)
- [Journal](#journal)
- [Goals](#goals)
- [Profile](#profile)
- [Account Settings](#account-settings)
  - [Unit Preferences](#unit-preferences)
  - [Change Password](#change-password)
  - [Multi-Factor Authentication](#multi-factor-authentication)
- [Common Features](#common-features)
  - [Date Range Filtering](#date-range-filtering)
  - [Search](#search)
  - [Sorting](#sorting)
  - [Pagination](#pagination)
- [Unit System](#unit-system)

---

## Getting Started

### Registration

1. Navigate to the registration page via the **"Register"** link on the login screen.
2. Fill in the required fields:
   - **Full Name** — required
   - **Email** — required; must be a valid email address; used for login
   - **Password** — required; minimum 6 characters
   - **Confirm Password** — must match password
3. Optional fields:
   - **Age** — 1 to 150
   - **Weight (lbs)** — 50 to 800; registration defaults to standard (lbs) units
4. Click **"Create Account"**.
5. You will be redirected to the **Onboarding Wizard**.

**Business Rules:**
- Email addresses must be unique across all accounts.
- Passwords are hashed with bcrypt before storage; they are never stored in plaintext.
- Registration is rate-limited to 50 attempts per 15 minutes per IP address.

### Onboarding Wizard

After registration, the wizard guides you through initial setup in three steps:

**Step 1 — Profile Setup:**
- Confirm or update your name, age, weight, and unit preference (Standard or Metric).

**Step 2 — Initial Goals:**
- Select from 9 goal categories: Activity, Weight, Sleep, Nutrition, Hydration, Blood Pressure, Blood Glucose, Heart Rate, and Journal.
- Each category offers a suggested goal (e.g., "Exercise 30 min daily") that you can customize.
- Set a title, target value, unit, and end date for each goal.

**Step 3 — Review & Confirm:**
- Review your profile and selected goals before saving.

**Business Rules:**
- The wizard must be completed before accessing the main application. Attempting to navigate to any other page will redirect you back to the wizard.
- Once completed, you cannot access the wizard again (you are redirected to the Dashboard).
- Each goal category can only have one active goal at a time.
- Goal end dates default to 30 days in the future (90 days for weight goals).

### Login

1. Enter your **email** and **password**.
2. Click **"Sign In"**.
3. If MFA is enabled, you will be prompted for a verification code (see [Multi-Factor Authentication](#multi-factor-authentication)).

**Business Rules:**
- Login is rate-limited to 50 attempts per 15 minutes per IP address.
- On successful login, a JWT token is issued that expires after 7 days.
- If MFA is enabled, the initial login returns a challenge instead of a token. The token is only issued after MFA verification.
- Logged-in users are automatically redirected away from the login page to the Dashboard.

### Forgot Password

1. Click **"Forgot password?"** on the login screen.
2. Enter your registered email address.
3. A 6-digit reset code is sent to your email.
4. Enter the code along with your new password (minimum 6 characters) and confirmation.
5. On success, you are redirected to the login page after 2 seconds.

**Business Rules:**
- The reset code is 6 digits, numeric only.
- New password and confirmation must match.
- You can resend the code or change the email address from step 2.

---

## Navigation

The application uses a sidebar navigation layout:

- **Sidebar (left)** — Links to Dashboard, Activities, Meals, Sleep, Vitals, Water, Journal, and Goals
- **Header (top-right)** — User avatar dropdown with links to Profile, Account Settings, and Sign Out

Clicking **Sign Out** clears your session and redirects to the login page.

---

## Dashboard

The Dashboard provides an at-a-glance overview of your wellness data for the **current week**.

### Stat Cards (top row)

Eight summary cards showing weekly averages:

| Card | Value | Unit |
|------|-------|------|
| Blood Pressure | Average systolic/diastolic | mmHg |
| Avg Glucose | Average glucose level | mg/dL |
| Avg Heart Rate | Average BPM | bpm |
| Current Weight | Most recent weight reading | lbs or kg |
| Avg Water Intake | Average daily water | oz/day or ml/day |
| Avg Daily Calories | Average calories per day | kcal/day |
| Avg Mood | Average mood score | /10 |
| Avg Exercise | Average exercise duration | min/day |

### Goal Progress

- Displays a **pie chart** showing progress across all your goals.
- Each goal shows a **progress bar** with current/target values and the date range.
- Progress percentage is auto-calculated from tracked data (see [Goals](#goals) for details).

### Trend Charts

Up to 7 trend charts are displayed in a responsive grid, each showing data from the current week:

- **Blood Pressure** — Systolic and diastolic lines
- **Heart Rate** — BPM line
- **Blood Glucose** — Glucose level line
- **Weight** — Weight line
- **Exercise** — Calories burned and duration bars
- **Water Intake** — Volume bars
- **Mood Trend** — Mood score line (1-10 scale)

Charts only appear when data exists for that category.

**Business Rules:**
- Dashboard data is scoped to the **current week** (Sunday through today) to reduce load time.
- Goals are fetched without date filtering (all goals are shown regardless of their date range).
- Weight is displayed in the user's preferred unit system.
- Water intake is normalized to oz internally, then converted for display based on unit preference.
- Mood scores are mapped from mood labels to a 1-10 numeric scale (e.g., Joyful = 10, Depressed = 1).
- Calories are averaged by unique calendar day, not by meal count.

---

## Activities

Track workouts and physical activities with detailed metrics.

### Form Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Name | Text | Yes | Max 100 characters | Description of the activity |
| Type | Select | Yes | running, walking, cycling, swimming, weightlifting, yoga, hiking, other | |
| Duration | Number | Yes | Minimum 1 minute | Duration in minutes |
| Calories Burned | Number | No | Minimum 0 | Can be manually entered or auto-estimated |
| Distance | Number | No | Minimum 0 | Displayed in mi or km based on unit preference |
| Distance Unit | Select | Auto | mi or km | Auto-set based on unit preference |
| Weight | Number | No | Minimum 0 | Weight used in the exercise (for weightlifting) |
| Reps | Number | No | Minimum 0 | Repetitions per set |
| Sets | Number | No | Minimum 0 | Number of sets |
| Steps | Number | No | Minimum 0 | Step count |
| Notes | Textarea | No | Max 500 characters | |
| Date | Date | No | Defaults to now | |

### Calorie Estimation

If you do not manually enter calories:
- Click the **"Estimate Calories"** button in the form.
- The system calculates an estimate based on your activity type, duration, and body weight from your profile.
- You can override the estimate by toggling manual entry.

### Summary Cards

- **Today's Exercise** — Total minutes exercised today vs. your daily goal (default: 30 minutes/day)
- **Period Summary** — Total minutes for the selected period vs. the period goal

### Chart

A collapsible bar chart showing calories burned and duration for each activity in the period.

**Business Rules:**
- Distance is stored in the unit entered (mi or km). When displayed, it is converted to match the user's unit preference.
- Weight used in exercises is converted between lbs and kg based on unit preference.
- The daily exercise goal is pulled from your Goals (if you have an activity goal with unit "minutes"). Otherwise, it defaults to 30 minutes.
- Period goal = daily goal × number of days in the selected period.
- Activities support full-text search across name, type, and notes fields.
- The table uses dynamic columns that display distance with the correct unit.

---

## Meals

Track your daily food intake with nutritional breakdown.

### Form Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Name | Text | Yes | Max 200 characters | Name of the food or meal |
| Meal Type | Select | Yes | breakfast, lunch, dinner, snack | |
| Calories | Number | Yes | Minimum 0 | |
| Protein (g) | Number | No | Minimum 0, default 0 | |
| Carbs (g) | Number | No | Minimum 0, default 0 | |
| Fat (g) | Number | No | Minimum 0, default 0 | |
| Cholesterol (mg) | Number | No | Minimum 0, default 0 | |
| Sodium (mg) | Number | No | Minimum 0, default 0 | |
| Notes | Textarea | No | Max 500 characters | |
| Date | Date | No | Defaults to now | |

### Summary Cards

- **Today's Calories** — Total calories consumed today vs. daily goal (default: 2,000 kcal/day)
- **Period Average** — Average daily calories for the selected period

### Chart

A collapsible bar chart showing calories per meal entry.

**Business Rules:**
- The daily calorie goal defaults to 2,000 kcal unless a nutrition goal with unit "calories" exists.
- Period average is calculated by grouping meals into calendar days and averaging the daily totals.
- Searchable by name, meal type, and notes.

---

## Sleep

Record and monitor your sleep patterns.

### Form Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Bedtime | Datetime | Yes | — | When you went to bed |
| Wake Time | Datetime | Yes | Must be after Bedtime | When you woke up |
| Quality | Select | No | poor, fair, good, excellent | Defaults to "good" |
| Notes | Textarea | No | Max 500 characters | |
| Date | Date | No | Defaults to now | |

### Summary Cards

- **Today's Sleep** — Duration of last night's sleep vs. goal (default: 8 hours)
- **Period Average** — Average sleep duration across the period

### Chart

A collapsible line chart showing sleep duration over time.

**Business Rules:**
- **Duration is auto-calculated** from bedtime and wake time. You do not enter it manually.
- **Wake time must be after bedtime.** The server rejects the record with an error if wake time is equal to or before bedtime.
- Duration is calculated in hours and rounded to 2 decimal places (e.g., 7.75 hours).
- The sleep goal defaults to 8 hours unless a sleep goal exists in your Goals.
- Searchable by quality and notes.

---

## Vitals

Track four vital sign categories in a tabbed interface. Each tab has its own data, form, chart, and summary.

### Blood Pressure

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Systolic (mmHg) | Number | Yes | 50–300 |
| Diastolic (mmHg) | Number | Yes | 30–200 |
| Pulse (bpm) | Number | No | 20–250 |
| Notes | Textarea | No | Max 500 characters |
| Date | Date | No | Defaults to now |

**Business Rules:**
- Default goal: systolic ≤ 120 mmHg (pulled from blood_pressure goal if it exists).
- Today's status shows "Normal" (green) if systolic ≤ goal, "Elevated" (indigo) otherwise.
- Period average displays mean systolic/diastolic across all readings in the period.
- Chart shows systolic (red) and diastolic (blue) lines.

### Blood Glucose

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Glucose Level (mg/dL) | Number | Yes | 20–600 |
| Measurement Type | Select | Yes | fasting, before_meal, after_meal, bedtime, random |
| Notes | Textarea | No | Max 500 characters |
| Date | Date | No | Defaults to now |

**Business Rules:**
- Default goal: glucose ≤ 100 mg/dL (pulled from blood_glucose goal if it exists).
- Today's status shows "Normal" if level ≤ goal, "Elevated" otherwise.
- Period average is the mean glucose level across all readings.
- Chart shows a single glucose line.

### Heart Rate

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Heart Rate (bpm) | Number | Yes | 20–250 |
| Context | Select | No | resting, active, post_exercise, sleeping | Defaults to "resting" |
| Notes | Textarea | No | Max 500 characters |
| Date | Date | No | Defaults to now |

**Business Rules:**
- Default goal: resting HR ≈ 72 bpm (pulled from heart_rate goal if it exists).
- Today's status shows "Normal" if BPM is within ±10 of goal, "Variable" otherwise.
- Period average is the mean BPM across all readings.

### Weight

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Weight | Number | Yes | 50–800 lbs (22.7–362.9 kg) | Min/max adjusts to unit |
| Unit | Select | Auto | lbs or kg | Auto-set based on unit preference (read-only) |
| Notes | Textarea | No | Max 500 characters |
| Date | Date | No | Defaults to now |

**Business Rules:**
- Weight is **stored in lbs** on the server regardless of what the user enters. Metric values are converted before saving and converted back for display.
- The unit field is auto-set and read-only based on your unit preference.
- Period average shows mean weight with the correct unit label (lbs or kg).
- The weight goal is pulled from your Goals if a weight goal exists (default: 150).

### Vitals Summary Card (all tabs)

Each tab shows a "Today's Summary" card with:
- The latest reading for today (or "No data yet")
- Goal comparison and progress indicator
- A collapsible period trend chart

**Business Rules:**
- The summary card values are memoized and only recomputed when the tab, today's data, or goal values change.
- Switching tabs loads data for that vital type; data is debounced (300ms) to prevent rapid API calls when switching quickly.

---

## Water Intake

Track daily hydration with volume-aware units.

### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Amount | Number | Yes | 1–500 oz (30–15,000 ml) | Min/max adjusts to unit |
| Unit | Select | Auto | oz or ml | Auto-set and read-only based on unit preference |
| Notes | Textarea | No | Max 500 characters |
| Date | Date | No | Defaults to now |

### Summary Cards

- **Today's Water Intake** — Total water consumed today vs. **daily goal** (64 oz or 1,892 ml)
  - Shows a green checkmark icon when the daily goal is met, or a trending-up icon when below goal
- **Period Summary** — Total water for the period vs. period goal

### Chart

A collapsible bar chart showing water intake per entry, with a unit-aware legend (e.g., "Water (oz)" or "Water (ml)").

**Business Rules:**
- Water amounts are stored and displayed in the user's preferred unit (oz or ml).
- **Daily goal**: 64 oz (standard) or 1,892 ml (metric). This is a fixed default.
- **Period goal** = daily goal × number of days in the selected period.
- Today's card compares against the **daily goal**, not the period goal.
- The bar chart tooltip and legend dynamically show the correct unit.
- Searchable by notes.

---

## Journal

A mood journaling feature for tracking emotional wellness.

### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Mood | Select (grid) | Yes | 24 predefined moods | Selected from a color-coded mood grid |
| Title | Text | Yes | Max 50 characters | |
| Content | Textarea | No | No max | Free-form journal entry |
| Date | Date | No | Defaults to now | |

### Available Moods

**Positive (high score):** Happy (9), Grateful (9), Peaceful (8), Hopeful (8), Joyful (10), Content (8)

**Negative (low score):** Anxious (3), Sad (2), Angry (2), Lonely (3), Fearful (3), Overwhelmed (2), Confused (4), Frustrated (3), Guilty (2), Ashamed (1), Jealous (3), Grief (1), Stressed (3), Tired (4), Discouraged (3), Worried (3), Depressed (1), Restless (4)

### Summary Cards

- **Today's Mood** — Your most recent mood entry for today with color-coded badge
- **Period Average** — Average mood score for the period (on a 1–10 scale)

### Chart

A collapsible line chart showing mood score trend over time (Y-axis: 0–10).

**Business Rules:**
- Moods are mapped to a numeric 1–10 scale for charting and averaging. Higher = more positive.
- The mood grid in the form uses color-coded badges (e.g., Happy = yellow, Sad = blue, Angry = red).
- Journal entries support full-text search across title, mood, and tags.
- The default date range for Journal is **"This Month"** (unlike most other pages which default to "This Week").
- The Journal page uses its own custom form with a mood selection grid, not the standard CrudPage form.

---

## Goals

Set and track wellness goals across all categories. Goal progress is **automatically computed** from your tracked data.

### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Title | Text | Yes | Max 200 characters |
| Category | Select | Yes | activity, nutrition, sleep, weight, hydration, blood_pressure, blood_glucose, heart_rate, journal |
| Target Value | Number | Yes | Minimum 0 |
| Current Value | Number | No | Minimum 0, default 0 |
| Unit | Text | No | Max 50 characters | e.g., miles, lbs, oz, days, hours, minutes, calories |
| Start Date | Date | No | Defaults to now |
| End Date | Date | Yes | — |
| Notes | Textarea | No | Max 500 characters |

### Auto-Computed Progress

When you view the Goals page, the server automatically queries your tracked data and updates each goal's `currentValue`. The logic varies by category and unit:

| Category | Unit | How Current Value is Computed |
|----------|------|------------------------------|
| Activity | days | Count of unique dates with at least one activity |
| Activity | minutes/hours | Sum of all activity durations |
| Activity | miles/km | Sum of all distances (auto-converted between mi/km) |
| Activity | steps | Sum of all step counts |
| Activity | calories | Sum of all calories burned |
| Nutrition | days | Count of unique dates with meal entries |
| Nutrition | calories | Sum of all meal calories |
| Nutrition | protein | Sum of all protein grams |
| Sleep | days/nights | Count of nights with ≥ 8 hours of sleep |
| Sleep | hours | Sum of all sleep durations |
| Weight | lbs/kg | Latest weight reading (auto-converted) |
| Hydration | days | Count of days meeting a threshold (extracted from goal title, default 64 oz) |
| Hydration | oz/ml | Sum of all water intake (auto-converted) |
| Blood Pressure | days | Count of days with systolic < 130 and diastolic < 85 |
| Blood Pressure | mmHg | Average systolic reading |
| Blood Glucose | days | Count of days with average glucose below threshold (extracted from title, default 100) |
| Blood Glucose | mg/dL | Average glucose level |
| Heart Rate | days | Count of unique dates with readings |
| Heart Rate | bpm | Average BPM |
| Journal | days | Count of unique dates with entries |
| Journal | entries | Total count of journal entries |

### Goal Types and Completion

- **Standard goals** (activity, nutrition, sleep, hydration, journal): Completed when `currentValue ≥ targetValue`.
- **Weight goals**: Direction-aware. A baseline weight is determined from the start of the goal period.
  - Weight *loss*: Completed when current weight ≤ target.
  - Weight *gain*: Completed when current weight ≥ target.
  - Progress is calculated relative to the baseline-to-target range.
- **"Keep under" goals** (blood pressure mmHg, blood glucose mg/dL, heart rate bpm): Success when the average reading is at or below the target. Shows 100% when at/below target, otherwise shows how close you are.

### Columns Displayed

| Column | Description |
|--------|-------------|
| Title | Goal name |
| Category | Goal category |
| Progress | Visual progress bar with percentage |
| Current | Auto-computed current value with unit |
| Target | Target value with unit |
| Start | Start date |
| Due | End date |

**Business Rules:**
- **One goal per category.** Creating a second goal for the same category returns an error: "A goal already exists for this category."
- Goal progress is computed on every page load, but **future goals** (start date in the future) and **completed past goals** (completed + end date in the past) are skipped to reduce database queries.
- The Goals page shows **all goals** regardless of date range (date range filtering is hidden).
- Unit conversion is applied for display (metric users see km, kg, ml) and reversed before saving (stored in standard units: mi, lbs, oz).
- Progress bars show green when complete, indigo when in progress.
- Future goals display "Future goal; not started yet" instead of a progress bar.

---

## Profile

Edit your personal information and profile photo.

### Fields

| Field | Editable | Notes |
|-------|----------|-------|
| Profile Photo | Yes | Click the photo to upload a new one. Max 2 MB. Accepted formats: JPG, PNG, GIF, WebP. |
| Full Name | Yes | Required |
| Email | Read-only | Displayed but cannot be changed |
| Age | Yes | 1–150 |
| Weight | Yes | 50–800 (in displayed unit) |
| Weight Unit | Yes | lbs or kg |
| Street | Yes | Optional address |
| City | Yes | Optional |
| State | Yes | Optional |
| Zip | Yes | Optional |

**Business Rules:**
- Email is displayed but read-only; it cannot be changed after registration.
- Avatar upload validates both file extension and MIME type server-side. Only real image files (not renamed text files) are accepted.
- The avatar is stored on the server in `public/avatars/` and served as a static file.
- The avatar appears in the top-right header dropdown across all pages.

---

## Account Settings

Accessible from the avatar dropdown menu in the header.

### Unit Preferences

Choose between **Standard** (lbs, ft, oz) and **Metric** (kg, m, ml).

**Business Rules:**
- Changing unit preference takes effect immediately across the entire application.
- All data is stored in standard units on the server; conversion happens at display time.
- Affected pages: Activities (distance, exercise weight), Vitals/Weight, Water Intake, Goals, and Dashboard.

### Change Password

| Field | Required | Validation |
|-------|----------|------------|
| Current Password | Yes | Must match your existing password |
| New Password | Yes | Minimum 6 characters |
| Confirm New Password | Yes | Must match new password |

**Business Rules:**
- The current password is verified server-side before allowing the change.
- The form clears on successful password change.

### Multi-Factor Authentication

MFA adds an extra layer of security to your login. Three methods are supported:

#### TOTP (Authenticator App)
1. Click **"Setup Authenticator"** in the MFA section.
2. Scan the displayed QR code with an authenticator app (Google Authenticator, Authy, etc.).
3. Enter the 6-digit code from your authenticator app to verify.
4. MFA is now enabled.

#### Email OTP
1. Click **"Enable Email MFA"** in the MFA section.
2. OTP codes will be sent to your registered email during login.

#### SMS OTP
1. Enter your phone number in the phone field.
2. Click **"Enable SMS MFA"**.
3. OTP codes will be sent to your phone during login.

#### Disabling MFA
- Click **"Disable MFA"** to turn off two-factor authentication.

**Business Rules:**
- Only one MFA method can be active at a time.
- TOTP works offline and does not require sending a code; it uses a time-based one-time password.
- Email and SMS OTP codes are 6 digits and auto-sent during login.
- MFA verification is rate-limited to **10 attempts per 15 minutes** to prevent brute-force attacks on 6-digit codes.
- For TOTP, there is no "Resend" option (the code regenerates every 30 seconds in your app).
- For email/SMS, you can click **"Resend"** on the MFA challenge screen.
- The MFA verification code field only accepts numeric input and is limited to 6 digits.

---

## Common Features

These features are shared across most data pages (Activities, Meals, Sleep, Vitals, Water Intake, Journal).

### Date Range Filtering

A row of range pills appears at the top of each page:

| Range | Description |
|-------|-------------|
| **This Week** | Sunday of the current week through today |
| **Last Week** | Previous full week (Sunday–Saturday) |
| **This Month** | First day of the current month through today |
| **This Year** | January 1 through today |
| **All Time** | No date filter; shows all data |

**Business Rules:**
- The default range is **"This Week"** for most pages.
- Journal defaults to **"This Month"**.
- Goals hide the range pills entirely and show all goals regardless of date.
- Changing the range immediately reloads data from the server with the new date boundaries.
- Period goals (e.g., exercise minutes, water intake) are recalculated based on the number of days in the selected range.

### Search

- A search bar with debounced input filters records as you type.
- Search is performed server-side and is case-insensitive.
- Search input is sanitized to prevent special regex characters from causing errors.
- Each page has specific searchable fields (listed in each page's section above).

### Sorting

- Click any column header to sort by that field.
- Click again to toggle between ascending and descending.
- An arrow indicator shows the current sort direction.
- Sort field names are validated server-side; invalid field names fall back to the default sort (date descending).

### Pagination

- Default page size: **20 rows**.
- Configurable: 10, 20, or 50 rows per page.
- Navigation controls: first, previous, next, last page buttons.
- Total record count and current page are displayed.

### Error Handling

- Save and delete operations show error messages in a red banner at the top of the page and inside the form modal.
- Errors can be dismissed by clicking the X button.
- Network errors display the server's error message if available, otherwise a generic fallback.
- The delete button shows a confirmation dialog before proceeding.

---

## Unit System

WellnessTracker supports two unit systems. Your preference is set in [Account Settings](#unit-preferences) and affects display across the entire application.

### Standard (default)
- Weight: **lbs**
- Distance: **mi** (miles)
- Volume: **oz** (fluid ounces)

### Metric
- Weight: **kg**
- Distance: **km** (kilometers)
- Volume: **ml** (milliliters)

### How Conversion Works

| What | Standard | Metric | Conversion |
|------|----------|--------|------------|
| Weight | lbs | kg | 1 lb = 0.4536 kg |
| Distance | mi | km | 1 mi = 1.6093 km |
| Volume | oz | ml | 1 oz = 29.5735 ml |

**Business Rules:**
- All data is **stored in standard units** on the server (lbs, mi, oz).
- Conversion happens at two points:
  1. **Display time**: Standard values are converted to metric for the UI.
  2. **Save time**: Metric input is converted back to standard before being sent to the server.
- This means switching your unit preference instantly converts all existing data for display — no data migration is needed.
- Form field labels, validation ranges (min/max), and units automatically adjust to your preference.
