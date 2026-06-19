export const getPagination = (query: Record<string, any>, defaultLimit = 20) => {
  const enabled = query.page !== undefined || query.limit !== undefined;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || defaultLimit));

  return { enabled, page, limit, skip: (page - 1) * limit };
};

export const paginationPayload = (items: any[], total: number, page: number, limit: number) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  },
});

export const escapeRegex = (value: unknown) =>
  String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
