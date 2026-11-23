import { parseFilters } from "./parser.js";

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildMongoFilter(parsedQuery) {
    const filters = parseFilters(parsedQuery.filters);
    const conditions = [];

    if (Object.keys(filters).length > 0) {
        conditions.push(filters);
    }

    if (parsedQuery.search) {
        const { term, fields } = parsedQuery.search;

        const regex = new RegExp(escapeRegex(term), "i");

        conditions.push({
            $or: fields.map(field => ({
                [field]: regex
            }))
        });
    }

    if (conditions.length === 0) return {};

    if (conditions.length === 1) return conditions[0];

    return { $and: conditions };
}