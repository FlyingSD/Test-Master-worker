import { useState, useMemo } from 'react'

export interface PaginationResult<T> {
  currentPage: number
  totalPages: number
  paginatedItems: T[]
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  itemsPerPage: number
  totalItems: number
}

export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 20
): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math?.max(1, Math?.ceil(items?.length / itemsPerPage))

  // Reset to page 1 if current page exceeds total pages
  if (currentPage > totalPages && items?.length > 0) {
    setCurrentPage(1)
  }

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items?.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  const goToPage = (page: number) => {
    const pageNumber = Math?.max(1, Math?.min(page, totalPages))
    setCurrentPage(pageNumber)
  }

  const nextPage = () => {
    goToPage(currentPage + 1)
  }

  const previousPage = () => {
    goToPage(currentPage - 1)
  }

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
    itemsPerPage,
    totalItems: items?.length,
  }
}
