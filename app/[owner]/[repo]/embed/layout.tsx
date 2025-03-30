"use client"

import type React from "react"
import "@/app/globals.css"

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style jsx global>{`
          :root {
            color-scheme: light;
          }
          html.dark {
            color-scheme: dark;
          }
          html.dark body {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
          }
        `}</style>
      </head>
      <body className="bg-transparent">{children}</body>
    </html>
  )
}

