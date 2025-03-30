import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TokenProvider } from "@/components/token-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title><b>GitStats</b> &ndash; GitHub Repository Viewer</title>
        <meta name="description" content="View GitHub repository information and embed it in your website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <TokenProvider>{children}</TokenProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'