
import { describe, it, expect } from "vitest";

import {
    validateQuery,
    PageFlowError
} from "../src/core/validator.js";

const config = {
    defaultLimit: 10,
    maxLimit: 100,
    searchableFields: ["trackingId", "recipient"],
    filterableFields: ["status", "department"],
    sortableFields: ["createdAt", "trackingId"]
};

describe("PageFlow Validator", () => {

    it("uses default pagination", () => {
        const result = validateQuery({}, config);

        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.skip).toBe(0);
    });

    it("calculates offset correctly", () => {
        const result = validateQuery({
            page: "3",
            limit: "10"
        }, config);

        expect(result.skip).toBe(20);
    });

    it("rejects excessive limits", () => {
        expect(() => validateQuery({
            limit: "500"
        }, config)).toThrow(PageFlowError);
    });

    it("rejects unauthorized sorting", () => {
        expect(() => validateQuery({
            sort: "password"
        }, config)).toThrow(PageFlowError);
    });

    it("parses descending sorting", () => {
        const result = validateQuery({
            sort: "-createdAt"
        }, config);

        expect(result.sort).toEqual([
            { field: "createdAt", direction: -1 }
        ]);
    });

    it("accepts allowed filters", () => {
        const result = validateQuery({
            status: "PENDING"
        }, config);

        expect(result.filters.status).toBe("PENDING");
    });

    it("rejects unauthorized filters", () => {
        expect(() => validateQuery({
            password: "secret"
        }, config)).toThrow(PageFlowError);
    });

    it("supports search", () => {
        const result = validateQuery({
            search: "UC123"
        }, config);

        expect(result.search.term).toBe("UC123");
        expect(result.search.fields).toEqual([
            "trackingId",
            "recipient"
        ]);
    });

    it("rejects object-based filter injection", () => {
        expect(() => validateQuery({
            status: { $ne: "COLLECTED" }
        }, config)).toThrow(PageFlowError);
    });

});
