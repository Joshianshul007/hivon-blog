/**
 * Client-side image compression using Canvas API (zero dependencies).
 * Resizes and compresses images before uploading to Supabase Storage.
 */

interface CompressOptions {
  /** Max width in pixels (default: 1200) */
  maxWidth?: number
  /** Max height in pixels (default: 1200) */
  maxHeight?: number
  /** JPEG/WebP quality 0-1 (default: 0.8) */
  quality?: number
  /** Output MIME type (default: image/webp) */
  outputType?: "image/webp" | "image/jpeg" | "image/png"
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    outputType = "image/webp",
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Draw to canvas at new size
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas context not available"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"))
            return
          }

          // Determine file extension
          const ext = outputType === "image/webp" ? "webp" : outputType === "image/jpeg" ? "jpg" : "png"
          const name = file.name.replace(/\.[^.]+$/, `.${ext}`)

          const compressed = new File([blob], name, { type: outputType })

          // Only use compressed if it's actually smaller
          if (compressed.size < file.size) {
            resolve(compressed)
          } else {
            resolve(file)
          }
        },
        outputType,
        quality
      )
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}

/** Format bytes to human readable string */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
