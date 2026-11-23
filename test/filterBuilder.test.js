import { describe, it, expect } from "vitest";
import { buildMongoFilter } from "../src/core/filterBuilder.js";

describe("MongoDB Filter Builder", () => {
    it("builds exact filters", () => {
        const result = buildMongoFilter({
            filters: { status: "PENDING" },
            search: null
        });

        expect(result).toEqual({ status: "PENDING" });
    });

    it("builds multi-field search", () => {
        const result = buildMongoFilter({
            filters: {},
            search: {
                term: "UC123",
                fields: ["trackingId", "recipient"]
            }
        });

        expect(result.$or).toHaveLength(2);
    });

    it("escapes regex characters", () => {
        const result = buildMongoFilter({
            filters: {},
            search: {
                term: ".*",
                fields: ["trackingId"]
            }
        });

        expect(result.$or[0].trackingId.test(".*")).toBe(true);
        expect(result.$or[0].trackingId.test("anything")).toBe(false);
    });

    it("combines search and filters", () => {
        const result = buildMongoFilter({
            filters: { status: "PENDING" },
            search: {
                term: "UC123",
                fields: ["trackingId"]
            }
        });

        expect(result.$and).toHaveLength(2);
    });
});