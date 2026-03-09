"use client";

import { useState } from "react";

export function usePagination(initialPage = 1, initialPageSize = 25) {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);

  return {
    page,
    pageSize,
    setPage,
  };
}
