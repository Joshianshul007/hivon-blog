"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { commentCreateSchema } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

interface CommentFormProps {
  postId: string
  onOptimisticAdd?: (text: string) => void
}

export function CommentForm({ postId, onOptimisticAdd }: CommentFormProps) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [debounced, setDebounced] = useState(false)
  const router = useRouter()

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (debounced || loading) return

    setLoading(true)
    setDebounced(true)

    try {
      const parsed = commentCreateSchema.safeParse({ comment_text: text })
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message)
        setLoading(false)
        setDebounced(false)
        return
      }

      if (onOptimisticAdd) {
        onOptimisticAdd(parsed.data.comment_text)
        setText("") // Optimistically clear the form
      }

      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_text: parsed.data.comment_text }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to post comment")
        setLoading(false)
        setDebounced(false)
        return
      }

      if (!onOptimisticAdd) {
        setText("")
      }
      toast.success("Comment posted!")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
      // Debounce: prevent re-submit for 1 second
      setTimeout(() => setDebounced(false), 1000)
    }
  }, [text, postId, debounced, loading, router, onOptimisticAdd])

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Write a comment (1-1000 characters)..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        rows={3}
        maxLength={1000}
        className="resize-y"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{text.length}/1000</span>
        <Button type="submit" size="sm" disabled={loading || debounced || text.trim().length === 0}>
          {loading ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-2 h-3.5 w-3.5" />
          )}
          {loading ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  )
}
