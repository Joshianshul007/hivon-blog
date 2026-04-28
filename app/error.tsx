"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Runtime error caught by boundary:", error)
  }, [error])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center px-4">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We encountered an unexpected error while trying to load this page.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Go to Home
        </Button>
      </div>
    </div>
  )
}
