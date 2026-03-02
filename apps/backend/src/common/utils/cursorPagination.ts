export type CursorPaginationParams<TCursor> = {
  cursor?: TCursor;
  limit?: number;
  orderBy?: 'asc' | 'desc';
};

export type CursorPaginationResult<TItem, TCursor> = {
  items: TItem[];
  nextCursor: TCursor | null;
  hasNextPage: boolean;
};

export function buildCursorPagination<TItem, TCursor>(
  data: TItem[],
  limit: number,
  getCursor: (item: TItem) => TCursor,
): CursorPaginationResult<TItem, TCursor> {
  const hasNextPage = data.length > limit;
  const items = hasNextPage ? data.slice(0, -1) : data;

  return {
    items,
    nextCursor: hasNextPage ? getCursor(items[items.length - 1]) : null,
    hasNextPage,
  };
}

export function buildPrismaCursorPaginationArgs(cursor?: string): {
  cursor?: { id: string };
  skip?: number;
} {
  if (!cursor) return {};

  return {
    cursor: { id: cursor },
    skip: 1,
  };
}
