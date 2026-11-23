# PageFlow

**A reusable pagination, filtering, sorting, and search engine for Node.js APIs.**

PageFlow helps you add consistent pagination, filtering, sorting, and multi-field search to APIs using Mongoose.

## Features

- Pagination with configurable default and maximum page sizes
- Field-based filtering with an allowlist
- Multi-field text search
- Ascending and descending sorting
- Combined search and filtering
- Consistent JSON response structure
- ESM and CommonJS support

## Installation

```bash
npm install @arpankaur/pageflow mongoose
```

Requires Node.js 18 or later.

## Quick Start

```js
import { createPageFlow } from "@arpankaur/pageflow";
import Parcel from "./models/Parcel.js";

const pageFlow = createPageFlow({
    defaultLimit: 10,
    maxLimit: 50,

    searchableFields: ["trackingId", "recipient"],
    filterableFields: ["status"],
    sortableFields: ["createdAt", "trackingId"]
});

const result = await pageFlow.execute(Parcel, {
    page: "1",
    limit: "10",
    search: "Arjun",
    status: "PENDING",
    sort: "-createdAt"
});

console.log(result);
```

## Configuration

| Option | Description | Default |
|---|---|---|
| `defaultLimit` | Default number of documents per page | `10` |
| `maxLimit` | Maximum permitted page size | `100` |
| `searchableFields` | Fields included in text search | `[]` |
| `filterableFields` | Fields allowed for filtering | `[]` |
| `sortableFields` | Fields allowed for sorting | `[]` |
| `maxSearchLength` | Maximum search string length | `200` |

Only configure fields that your API is allowed to expose for searching, filtering, or sorting.

## Supported Query Parameters

| Parameter | Example | Description |
|---|---|---|
| `page` | `?page=2` | Selects the page |
| `limit` | `?limit=10` | Sets the page size |
| `search` | `?search=Arjun` | Searches configured fields |
| `sort` | `?sort=-createdAt` | Sorts descending |
| `sort` | `?sort=trackingId` | Sorts ascending |
| Filter | `?status=PENDING` | Filters by an allowed field |

Multiple sort fields can be comma-separated:

```text
?sort=-createdAt,trackingId
```

Search uses case-insensitive regular-expression matching with user input escaped as a literal string. Filtering currently supports equality matching.

## Example Express Route

```js
import express from "express";
import { createPageFlow } from "@arpankaur/pageflow";
import Parcel from "../models/Parcel.js";

const router = express.Router();

const pageFlow = createPageFlow({
    defaultLimit: 10,
    maxLimit: 50,
    searchableFields: ["trackingId", "recipient"],
    filterableFields: ["status"],
    sortableFields: ["createdAt", "trackingId"]
});

router.get("/", async (req, res, next) => {
    try {
        const result = await pageFlow.execute(Parcel, req.query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
```

## Example Response

```json
{
  "success": true,
  "data": [
    {
      "trackingId": "UC001",
      "status": "PENDING",
      "recipient": "Arjun"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

The `data` array contains the documents returned by Mongoose.

## Error Handling

Invalid query parameters and disallowed fields throw `PageFlowError`, which includes a `statusCode` property.

Example Express error handler:

```js
import { PageFlowError } from "@arpankaur/pageflow";

app.use((err, req, res, next) => {
    if (err instanceof PageFlowError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    next(err);
});
```

## Limitations

- The current adapter supports Mongoose models.
- Filtering currently supports equality matching only.
- Search is basic case-insensitive substring matching, not a full-text search engine.
- Pagination uses offset-based pagination (`skip` and `limit`).
- MongoDB integration should be tested against your own database and schema before production use.

## Development

Clone the repository:

```bash
git clone https://github.com/Arpan-Kaur2006/pageFlow.git
cd pageFlow
npm install
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## License

MIT

