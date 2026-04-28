"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"

interface AdminDeleteButtonProps {
  id: string
  type: "post" | "comment"
  postId?: string
}

export function AdminDeleteButton({ id, type, postId }: AdminDeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return
    setLoading(true)
    try {
      let res: Response
      if (type === "post") {
        res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
      } else {
        res = await fetch(`/api/posts/${postId}/comments?commentId=${id}`, { method: "DELETE" })
      }
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || `Failed to delete ${type}`)
        return
      }
      toast.success(`${type === "post" ? "Post" : "Comment"} deleted`)
      router.refresh()
    } catch {
      toast.error(`Failed to delete ${type}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  )
}
