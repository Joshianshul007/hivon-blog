"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query) {
        params.set("q", query)
        params.delete("page") // Reset page on new search
      } else {
        params.delete("q")
      }
      router.push(`/posts?${params.toString()}`)
    }, 400)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9"
        id="search-posts"
      />
    </div>
  )
}
