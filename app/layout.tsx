import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "next-themes"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: {
    default: "Hivon Blog",
    template: "%s | Hivon Blog",
  },
  description: "A full-stack blogging platform with AI-generated post summaries. Built with Next.js, Supabase, and Google Gemini.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn("font-sans antialiased", geistSans.variable, geistMono.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main>{children}</main>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
