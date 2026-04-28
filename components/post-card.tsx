import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { CalendarDays, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface PostCardProps {
  id: string
  title: string
  summary: string | null
  image_url: string | null
  created_at: string
  author: { name: string } | null
  summary_status?: string
}

export function PostCard({ id, title, summary, image_url, created_at, author, summary_status }: PostCardProps) {
  const formattedDate = new Date(created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Link href={`/posts/${id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {image_url ? (
            <Image
              src={image_url}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <PenIcon className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </CardHeader>
        <CardContent className="pb-2">
          {summary_status === "ready" && summary ? (
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
              <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>
            </div>
          ) : summary_status === "pending" ? (
            <p className="text-sm text-muted-foreground italic">Generating AI summary...</p>
          ) : summary_status === "failed" ? (
            <p className="text-sm text-muted-foreground italic">Summary unavailable</p>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-3">{summary || "No summary available"}</p>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {author.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formattedDate}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("", className)}>
      <path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </svg>
  )
}
