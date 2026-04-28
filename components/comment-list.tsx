"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trash2, User, CalendarDays, Loader2 } from "lucide-react"

interface Comment {
  id: string
  comment_text: string
  created_at: string
  user_id: string
  user: { name: string } | null
}

interface CommentListProps {
  comments: Comment[]
  postId: string
  currentUserId?: string | null
  currentUserRole?: string | null
  onOptimisticDelete?: (id: string) => void
}

export function CommentList({ comments, postId, currentUserId, currentUserRole, onOptimisticDelete }: CommentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (commentId: string) => {
    if (onOptimisticDelete) {
      onOptimisticDelete(commentId)
    }
    setDeletingId(commentId)
    try {
      const res = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to delete comment")
        return
      }

      toast.success("Comment deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete comment")
    } finally {
      setDeletingId(null)
    }
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const canDelete =
          currentUserRole === "admin" ||
          currentUserId === comment.user_id

        return (
          <div key={comment.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 font-medium">
                  <User className="h-3.5 w-3.5" />
                  {comment.user?.name || "Unknown"}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(comment.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="text-destructive hover:text-destructive h-8 px-2"
                >
                  {deletingId === comment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
          </div>
        )
      })}
    </div>
  )
}
