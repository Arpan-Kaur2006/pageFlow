import { executeMongo } from "./adapters/mongodb.js";

export { PageFlowError } from "./core/validator.js";

export function createPageFlow(config = {}) {
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