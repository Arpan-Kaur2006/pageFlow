// src/core/validator.js
var PageFlowError = class extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PageFlowError";
    this.statusCode = statusCode;
  }
};
function validateQuery(query, config = {}) {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    searchableFields = [],
    filterableFields = [],
    sortableFields = [],
    maxSearchLength = 200
  } = config;
  if (!query || typeof query !== "object" || Array.isArray(query)) {
    throw new PageFlowError("Invalid query parameters");
  }
  const parsePositiveInteger = (value, fallback, name) => {
    if (value === void 0) return fallback;
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
      throw new PageFlowError(`${name} must be a positive integer`);
    }
    const number = Number(value);
    if (!Number.isSafeInteger(number)) {
      throw new PageFlowError(`${name} is too large`);
    }
    return number;
  };
  const page = parsePositiveInteger(query.page, 1, "page");
  const limit = parsePositiveInteger(
    query.limit,
    defaultLimit,
    "limit"
  );
  if (limit > maxLimit) {
    throw new PageFlowError(
      `limit cannot exceed ${maxLimit}`
    );
  }
  const sort = [];
  if (query.sort !== void 0) {
    if (typeof query.sort !== "string") {
      throw new PageFlowError("Invalid sort parameter");
    }
    for (const item of query.sort.split(",")) {
      const field = item.startsWith("-") ? item.slice(1) : item;
      if (!field || !sortableFields.includes(field)) {
        throw new PageFlowError(
          `Sorting by '${field}' is not allowed`
        );
      }
      if (sort.some((entry) => entry.field === field)) {
        throw new PageFlowError(
          `Duplicate sort field: ${field}`
        );
      }
      sort.push({
        field,
        direction: item.startsWith("-") ? -1 : 1
      });
    }
  }
  let search = null;
  if (query.search !== void 0) {
    if (typeof query.search !== "string" || query.search.length > maxSearchLength) {
      throw new PageFlowError("Invalid search parameter");
    }
    const term = query.search.trim();
    if (term) {
      if (searchableFields.length === 0) {
        throw new PageFlowError(
          "Search is not configured"
        );
      }
      search = {
        term,
        fields: searchableFields
      };
    }
  }
  const reserved = /* @__PURE__ */ new Set([
    "page",
    "limit",
    "sort",
    "search"
  ]);
  const filters = {};
  for (const [field, value] of Object.entries(query)) {
    if (reserved.has(field)) continue;
    if (!filterableFields.includes(field)) {
      throw new PageFlowError(
        `Filtering by '${field}' is not allowed`
      );
    }
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
      throw new PageFlowError(
        `Invalid filter value for '${field}'`
      );
    }
    filters[field] = value;
  }
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort,
    search,
    filters
  };
}

// src/core/parser.js
function parseSort(sort) {
  return Object.fromEntries(
    sort.map(({ field, direction }) => [
      field,
      direction
    ])
  );
}
function parseFilters(filters) {
  return { ...filters };
}

// src/core/filterBuilder.js
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function buildMongoFilter(parsedQuery) {
  const filters = parseFilters(parsedQuery.filters);
  const conditions = [];
  if (Object.keys(filters).length > 0) {
    conditions.push(filters);
  }
  if (parsedQuery.search) {
    const { term, fields } = parsedQuery.search;
    const regex = new RegExp(escapeRegex(term), "i");
    conditions.push({
      $or: fields.map((field) => ({
        [field]: regex
      }))
    });
  }
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

// src/core/responseBuilder.js
function buildResponse({
  data,
  totalItems,
  page,
  limit
}) {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    success: true,
    data,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0
    }
  };
}

// src/adapters/mongodb.js
async function executeMongo(model, query, config) {
  if (!model || typeof model.find !== "function") {
    throw new TypeError("A valid Mongoose model is required");
  }
  const parsed = validateQuery(query, config);
  const filter = buildMongoFilter(parsed);
  const sort = parseSort(parsed.sort);
  const [data, totalItems] = await Promise.all([
    model.find(filter).sort(sort).skip(parsed.skip).limit(parsed.limit).lean().exec(),
    model.countDocuments(filter).exec()
  ]);
  return buildResponse({
    data,
    totalItems,
    page: parsed.page,
    limit: parsed.limit
  });
}

// src/index.js
function createPageFlow(config = {}) {
  const options = {
    defaultLimit: 10,
    maxLimit: 100,
    searchableFields: [],
    filterableFields: [],
    sortableFields: [],
    maxSearchLength: 200,
    ...config
  };
  return {
    async execute(model, query) {
      return executeMongo(model, query, options);
    }
  };
}
export {
  PageFlowError,
  createPageFlow
};
