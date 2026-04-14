/**
 * Returns { startDate, endDate } ISO strings for common date ranges.
 */

function startOfDay(d) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function startOfWeek(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay()); // Sunday
  return startOfDay(r);
}

export const RANGES = [
  { key: "week", label: "This Week" },
  { key: "lastWeek", label: "Last Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

/**
 * Returns { label, daysInPeriod } for a given range key and optional rows array.
 * Consolidates the duplicated period-calculation logic used across pages.
 */
export function getPeriodInfo(range, rows = []) {
  let label = "Today";
  let daysInPeriod = 1;

  if (range === "week") {
    label = "This Week";
    const dayOfWeek = new Date().getDay(); // 0 = Sunday
    daysInPeriod = dayOfWeek + 1;
  } else if (range === "lastWeek") {
    label = "Last Week";
    daysInPeriod = 7;
  } else if (range === "month") {
    label = "This Month";
    const now = new Date();
    daysInPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  } else if (range === "year") {
    label = "This Year";
    const now = new Date();
    const year = now.getFullYear();
    daysInPeriod = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
  } else if (range === "all") {
    label = "All Time";
    if (rows.length > 0) {
      const dates = rows.map((r) => new Date(r.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      daysInPeriod = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
    }
  }

  return { label, daysInPeriod };
}

export function getDateRange(key) {
  const now = new Date();

  switch (key) {
    case "week": {
      const start = startOfWeek(now);
      return { fromDate: start.toISOString(), toDate: endOfDay(now).toISOString() };
    }
    case "lastWeek": {
      const thisWeekStart = startOfWeek(now);
      const end = new Date(thisWeekStart);
      end.setMilliseconds(-1); // last ms of previous week
      const start = startOfWeek(end);
      return { fromDate: start.toISOString(), toDate: end.toISOString() };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { fromDate: startOfDay(start).toISOString(), toDate: endOfDay(now).toISOString() };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { fromDate: startOfDay(start).toISOString(), toDate: endOfDay(now).toISOString() };
    }
    case "all":
    default:
      return {};
  }
}
