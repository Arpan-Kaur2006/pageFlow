import { describe, it, expect, vi } from "vitest";
import { executeMongo } from "../src/adapters/mongodb.js";

describe("MongoDB Adapter", () => {
    it("executes pagination and returns correct metadata", async () => {
        const mockData = [
            { trackingId: "UC001", status: "PENDING" },
            { trackingId: "UC002", status: "PENDING" }
        ];

        const findQuery = {
            sort: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue(mockData)
        };

        const countQuery = {
            exec: vi.fn().mockResolvedValue(25)
        };

        const model = {
            find: vi.fn().mockReturnValue(findQuery),
            countDocuments: vi.fn().mockReturnValue(countQuery)
        };

        const config = {
            defaultLimit: 10,
            maxLimit: 100,
            searchableFields: ["trackingId"],
            filterableFields: ["status"],
            sortableFields: ["createdAt"]
        };

        const result = await executeMongo(
            model,
            { page: "2", limit: "10", status: "PENDING" },
            config
        );

        expect(findQuery.skip).toHaveBeenCalledWith(10);
        expect(findQuery.limit).toHaveBeenCalledWith(10);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData);
        expect(result.pagination.totalItems).toBe(25);
        expect(result.pagination.totalPages).toBe(3);
    });
});