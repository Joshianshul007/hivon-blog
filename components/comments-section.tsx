"use client"

import { useOptimistic, startTransition, useCallback } from "react"
import { CommentForm } from "./comment-form"
import { CommentList } from "./comment-list"
import Link from "next/link"

interface Comment {
  id: string
  comment_text: string
  created_at: string
  user_id: string
  user: { name: string } | null
}

interface CommentsSectionProps {
  postId: string
  initialComments: Comment[]
  currentUserId: string | null
  currentUserRole: string | null
  currentUserName: string | null
}

export function CommentsSection({
  postId,
  initialComments,
  currentUserId,
  currentUserRole,
  currentUserName,
}: CommentsSectionProps) {
  const [optimisticComments, setOptimisticComments] = useOptimistic(
    initialComments,
    (state, action: { type: "add" | "delete"; comment?: Comment; id?: string }) => {
      if (action.type === "add" && action.comment) {
        return [...state, action.comment]
      }
      if (action.type === "delete" && action.id) {
        return state.filter((c) => c.id !== action.id)
      }
      return state
    }
  )

  const onAdd = useCallback((text: string) => {
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      comment_text: text,
      created_at: new Date().toISOString(),
      user_id: currentUserId || "",
      user: { name: currentUserName || "You" },
    }
    startTransition(() => {
      setOptimisticComments({ type: "add", comment: tempComment })
    })
  }, [currentUserId, currentUserName, setOptimisticComments])

  const onDelete = useCallback((id: string) => {
    startTransition(() => {
      setOptimisticComments({ type: "delete", id })
    })
  }, [setOptimisticComments])

  return (
    <section className="mt-12 border-t pt-8 space-y-6">
      <h2 className="text-xl font-semibold">
        Comments{" "}
        {optimisticComments.length > 0 && `(${optimisticComments.length})`}
      </h2>

      {currentUserId ? (
        <CommentForm postId={postId} onOptimisticAdd={onAdd} />
      ) : (
        <div className="rounded-lg border bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>{" "}
            to leave a comment.
          </p>
        </div>
      )}

      <CommentList
        comments={optimisticComments}
        postId={postId}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onOptimisticDelete={onDelete}
      />
    </section>
  )
}
