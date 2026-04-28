"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import { Button } from "@/components/ui/button"
import { 
  Bold, Italic, Strikethrough, Code, 
  Heading2, Heading3, 
  List, ListOrdered, Quote, ImageIcon, 
  Undo, Redo 
} from "lucide-react"
import { useRef } from "react"
import { compressImage } from "@/lib/image-compress"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  disabled?: boolean
}

const MenuBar = ({ editor, disabled }: { editor: ReturnType<typeof useEditor> | null, disabled?: boolean }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  if (!editor) {
    return null
  }

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller")
      return
    }

    const toastId = toast.loading("Uploading image...")

    try {
      // Compress
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        outputType: "image/webp",
      })

      // Upload
      const ext = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from("post-images")
        .upload(fileName, compressed, { contentType: compressed.type })

      if (error) throw new Error(error.message)

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName)

      // Insert into editor
      editor.chain().focus().setImage({ src: urlData.publicUrl }).run()
      toast.success("Image uploaded", { id: toastId })
    } catch {
      toast.error("Failed to upload image", { id: toastId })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-muted/40 rounded-t-md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "bg-muted" : ""}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "bg-muted" : ""}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "bg-muted" : ""}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive("code") ? "bg-muted" : ""}
      >
        <Code className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "bg-muted" : ""}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "bg-muted" : ""}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "bg-muted" : ""}
      >
        <Quote className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon className="h-4 w-4" />
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={addImage} 
          accept="image/*" 
          className="hidden" 
        />
      </Button>

      <div className="flex-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function RichTextEditor({ content, onChange, disabled }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg border my-4 max-w-full h-auto",
        },
      }),
    ],
    content: content,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
  })

  return (
    <div className={`border rounded-md ${disabled ? "opacity-60" : ""}`}>
      <MenuBar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  )
}
