"use client"

import { useEffect, useState } from "react"

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight > 0) {
        const scrolled = (window.scrollY / scrollHeight) * 100
        setProgress(Math.min(100, Math.max(0, scrolled)))
      }
    }

    window.addEventListener("scroll", updateProgress)
    updateProgress() // Initial call

    return () => window.removeEventListener("scroll", updateProgress)
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
