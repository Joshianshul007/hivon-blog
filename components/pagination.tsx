"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/posts?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((page, idx, arr) => {
            // Add ellipsis
            const elements = []
            if (idx > 0 && page - arr[idx - 1] > 1) {
              elements.push(
                <span key={`ellipsis-${page}`} className="px-2 text-sm text-muted-foreground">
                  ...
                </span>
              )
            }
            elements.push(
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className="w-9"
              >
                {page}
              </Button>
            )
            return elements
          })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}
