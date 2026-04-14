/**
 * Parse common query params and return a Mongoose-ready query config.
 *
 * Supported params:
 *   page     – 1-indexed page number (default 1)
 *   limit    – items per page (default 20, max 100)
 *   sort     – field name, prefix with - for desc (default "-date")
 *   search   – text search applied to searchFields
 *   fromDate  – ISO date string, inclusive lower bound for dateField
 *   toDate    – ISO date string, inclusive upper bound for dateField
 *
 * @param {object} query     - req.query
 * @param {string[]} searchFields - model fields to search on (regex)
 * @param {string} defaultSort   - default sort field
 * @param {string} dateField     - model field used for date range filter (default "date")
 * @returns {{ filter, sort, skip, limit, page, pageSize }}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseQuery(query, searchFields = [], defaultSort = "-date", dateField = "date") {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  // Sort — only allow alphanumeric, underscore, dot (no $ or nested operator injection)
  let sortStr = query.sort || defaultSort;
  const sortField = sortStr.startsWith("-") ? sortStr.slice(1) : sortStr;
  const sortObj = {};
  if (/^[a-zA-Z0-9_.]+$/.test(sortField)) {
    sortObj[sortField] = sortStr.startsWith("-") ? -1 : 1;
  } else {
    // Invalid sort field — fall back to default
    const defField = defaultSort.startsWith("-") ? defaultSort.slice(1) : defaultSort;
    sortObj[defField] = defaultSort.startsWith("-") ? -1 : 1;
  }

  // Search filter
  let filter = {};
  if (query.search && query.search.trim() && searchFields.length) {
    const regex = new RegExp(escapeRegex(query.search.trim()), "i");
    filter.$or = searchFields.map((f) => ({ [f]: regex }));
  }

  // Date range filter
  if (query.fromDate || query.toDate) {
    filter[dateField] = {};
    if (query.fromDate) filter[dateField].$gte = new Date(query.fromDate);
    if (query.toDate) filter[dateField].$lte = new Date(query.toDate);
  }

  return { filter, sort: sortObj, skip, limit, page, pageSize: limit };
}

/**
 * Execute a paginated query and return { data, meta }.
 * @param {object} baseFilter - extra filter merged into every query (e.g. { userId })
 */
async function paginatedQuery(Model, query, searchFields, defaultSort, dateField, baseFilter = {}) {
  const { filter, sort, skip, limit, page, pageSize } = parseQuery(query, searchFields, defaultSort, dateField);
  const merged = { ...baseFilter, ...filter };
  const [data, total] = await Promise.all([
    Model.find(merged).sort(sort).skip(skip).limit(limit).lean(),
    Model.countDocuments(merged),
  ]);
  return {
    data,
    meta: {
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      totalCount: total,
    },
  };
}

module.exports = { parseQuery, paginatedQuery };
