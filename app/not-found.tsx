import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileQuestion } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
}

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-6xl font-black tracking-tight">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/posts">Browse Posts</Link>
        </Button>
      </div>
    </div>
  )
}
