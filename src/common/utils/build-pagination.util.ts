import { Pagination } from '../types/pagination.type';

export function buildPagination(
  page: number,
  limit: number,
  total: number,
): Pagination {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
