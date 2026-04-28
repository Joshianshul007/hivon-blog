import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const title = searchParams.get("title") || "Hivon Blog"
    const author = searchParams.get("author") || "Guest Author"

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#09090b", // zinc-950 for dark theme
            color: "#ffffff",
            padding: "40px",
            fontFamily: "sans-serif",
            border: "12px solid #3b82f6", // blue-500 primary color
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "40px",
              fontSize: "48px",
              fontWeight: "bold",
              color: "#3b82f6",
            }}
          >
            Hivon Blog
          </div>
          
          <div
            style={{
              display: "flex",
              textAlign: "center",
              fontSize: "64px",
              fontWeight: "900",
              letterSpacing: "-0.05em",
              marginBottom: "30px",
              lineHeight: "1.2",
              maxWidth: "800px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "32px",
              color: "#a1a1aa", // zinc-400
              marginTop: "auto",
            }}
          >
            By {author}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch {
    return new Response("Failed to generate OG image", { status: 500 })
  }
}
