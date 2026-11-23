import { validateQuery } from "../core/validator.js";
import { parseSort } from "../core/parser.js";
import { buildMongoFilter } from "../core/filterBuilder.js";
import { buildResponse } from "../core/responseBuilder.js";

export async function executeMongo(model, query, config) {
    if (!model || typeof model.find !== "function") {
        throw new TypeError("A valid Mongoose model is required");
    }

    const parsed = validateQuery(query, config);

    const filter = buildMongoFilter(parsed);
    const sort = parseSort(parsed.sort);

    const [data, totalItems] = await Promise.all([
        model.find(filter)
            .sort(sort)
            .skip(parsed.skip)
            .limit(parsed.limit)
            .lean()
            .exec(),

        model.countDocuments(filter).exec()
    ]);

    return buildResponse({
        data,
        totalItems,
        page: parsed.page,
        limit: parsed.limit
    });
}