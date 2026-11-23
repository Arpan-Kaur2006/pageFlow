export function buildResponse({
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