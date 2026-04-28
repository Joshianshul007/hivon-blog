"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { postCreateSchema, postUpdateSchema } from "@/lib/validators"
import { compressImage, formatFileSize } from "@/lib/image-compress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"

const RichTextEditor = dynamic(() => import("@/components/rich-text-editor").then(mod => mod.RichTextEditor), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full border rounded-md bg-muted/20 animate-pulse" />
})
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface PostFormProps {
  mode: "create" | "edit"
  initialData?: {
    id: string
    title: string
    body: string
    image_url: string | null
  }
}

export function PostForm({ mode, initialData }: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [body, setBody] = useState(initialData?.body || "")
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image_url || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Enforce <= 5MB and image/* mimetype
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller")
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed")
      return
    }

    try {
      const originalSize = file.size
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        outputType: "image/webp",
      })

      const saved = originalSize - compressed.size
      if (saved > 0) {
        toast.success(
          `Image compressed: ${formatFileSize(originalSize)} → ${formatFileSize(compressed.size)} (${Math.round((saved / originalSize) * 100)}% smaller)`
        )
      }

      setImageFile(compressed)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(compressed)
    } catch {
      // Fallback: use original file if compression fails
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl

    const ext = imageFile.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("post-images")
      .upload(fileName, imageFile, { contentType: imageFile.type })

    if (error) {
      throw new Error(`Image upload failed: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "create") {
        const parsed = postCreateSchema.safeParse({ title, body })
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message)
          setLoading(false)
          return
        }

        const uploadedUrl = await uploadImage()

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: parsed.data.title,
            body: parsed.data.body,
            image_url: uploadedUrl,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || "Failed to create post")
          setLoading(false)
          return
        }

        toast.success("Post created! AI summary is being generated...")
        router.push(`/posts/${data.id}`)
        router.refresh()
      } else {
        // Edit mode
        const parsed = postUpdateSchema.safeParse({ title, body })
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message)
          setLoading(false)
          return
        }

        const uploadedUrl = await uploadImage()

        const res = await fetch(`/api/posts/${initialData!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: parsed.data.title,
            body: parsed.data.body,
            image_url: uploadedUrl,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || "Failed to update post")
          setLoading(false)
          return
        }

        toast.success("Post updated!")
        router.push(`/posts/${initialData!.id}`)
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred"
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create New Post" : "Edit Post"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder="Enter a compelling title (3-200 characters)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{title.length}/200 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-body">Content</Label>
            <RichTextEditor
              content={body}
              onChange={setBody}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{body.replace(/<[^>]*>?/gm, '').length} characters</p>
          </div>

          <div className="space-y-2">
            <Label>Featured Image</Label>
            <div className="flex flex-col gap-3">
              {imagePreview ? (
                <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm">Click to upload an image</span>
                  <span className="text-xs">PNG, JPG, GIF — Max 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {loading
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Publish Post"
                : "Save Changes"
            }
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
