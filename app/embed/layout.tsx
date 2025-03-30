import type React from "react"
import "@/app/globals.css"

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-transparent">{children}</body>
    </html>
  )
}

