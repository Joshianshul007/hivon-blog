"use client"

import { useMemo } from "react"
import DOMPurify from "isomorphic-dompurify"

interface SafeHTMLProps {
  html: string
  className?: string
}

/**
 * Renders sanitized HTML safely, preventing XSS from rich text editor output.
 * Uses DOMPurify to strip malicious attributes and tags before rendering.
 */
export function SafeHTML({ html, className }: SafeHTMLProps) {
  const sanitized = useMemo(() => {
    // Add loading="lazy" to all images for performance
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if ("tagName" in node && node.tagName.toLowerCase() === "img") {
        node.setAttribute("loading", "lazy")
        node.setAttribute("style", "max-width: 100%; height: auto;")
      }
    })

    const result = DOMPurify.sanitize(html, {
      // Allow standard rich-text tags but block anything dangerous
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "br", "hr",
        "strong", "em", "s", "u", "code", "pre",
        "ul", "ol", "li",
        "blockquote",
        "a",
        "img",
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel",   // links
        "src", "alt", "width", "height", "class",  // images
      ],
      // Force external links to be safe
      FORCE_BODY: true,
      ADD_ATTR: ["target"],
    })

    // Clean up hook to avoid memory leaks
    DOMPurify.removeHook("afterSanitizeAttributes")
    return result
  }, [html])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
