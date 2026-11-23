
export class PageFlowError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "PageFlowError";
        this.statusCode = statusCode;
    }
}

export function validateQuery(query, config = {}) {
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
        if (value === undefined) return fallback;

        if (
            typeof value !== "string" ||
            !/^[1-9]\d*$/.test(value)
        ) {
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

    // Validate sorting
    const sort = [];

    if (query.sort !== undefined) {
        if (typeof query.sort !== "string") {
            throw new PageFlowError("Invalid sort parameter");
        }

        for (const item of query.sort.split(",")) {
            const field = item.startsWith("-")
                ? item.slice(1)
                : item;

            if (!field || !sortableFields.includes(field)) {
                throw new PageFlowError(
                    `Sorting by '${field}' is not allowed`
                );
            }

            if (sort.some(entry => entry.field === field)) {
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

    // Validate search
    let search = null;

    if (query.search !== undefined) {
        if (
            typeof query.search !== "string" ||
            query.search.length > maxSearchLength
        ) {
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

    // Validate filters
    const reserved = new Set([
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

        if (
            typeof value !== "string" &&
            typeof value !== "number" &&
            typeof value !== "boolean"
        ) {
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

