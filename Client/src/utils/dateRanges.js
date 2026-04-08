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
