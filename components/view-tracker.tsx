"use client"

import { useEffect, useRef } from "react"

export function ViewTracker({ postId }: { postId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true
      // Call the API to increment the view counter
      fetch(`/api/posts/${postId}/views`, { method: "POST" }).catch(() => {
        // Silently fail if view tracking fails
      })
    }
  }, [postId])

  return null
}
