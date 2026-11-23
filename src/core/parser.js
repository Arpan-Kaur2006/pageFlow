export function parseSort(sort) {
    return Object.fromEntries(
        sort.map(({ field, direction }) => [
            field,
            direction
        ])
    );
}

export function parseFilters(filters) {
    return { ...filters };
}