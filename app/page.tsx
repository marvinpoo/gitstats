"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Github, Search, Moon, Sun, Gamepad2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TokenInput } from "@/components/token-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  
  // Fix: Only access window object on the client side
  const [domainUrl, setDomainUrl] = useState("")
  
  // useEffect will only run on the client side
  useEffect(() => {
    setDomainUrl(window.location.origin + "/")
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Parse GitHub URL to extract owner and repo
      const url = new URL(repoUrl)
      const pathSegments = url.pathname.split("/").filter(Boolean)

      if (url.hostname !== "github.com" || pathSegments.length < 2) {
        throw new Error("Invalid GitHub repository URL")
      }

      const owner = pathSegments[0]
      const repo = pathSegments[1]

      // Navigate to the repository page
      router.push(`/${owner}/${repo}`)
    } catch (err) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/marvinpoo/gitstats)")
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex justify-end mb-4">
        <Select value={theme} onValueChange={(value) => setTheme(value)} aria-label="Select theme">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select theme">
              <div className="flex items-center">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 mr-2" />
                ) : theme === "light" ? (
                  <Sun className="h-4 w-4 mr-2" />
                ) : theme === "retro" ? (
                  <Gamepad2 className="h-4 w-4 mr-2" />
                ) : (
                  <span className="mr-2">🖥️</span>
                )}
                {theme === "dark" ? "Dark" : theme === "light" ? "Light" : theme === "retro" ? "Retro" : "System"}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">
              <div className="flex items-center">
                <Sun className="h-4 w-4 mr-2" />
                Light
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center">
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </div>
            </SelectItem>
            <SelectItem value="retro">
              <div className="flex items-center">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Retro
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col items-center mb-10">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Github className="mr-2 h-8 w-8" /><b className="text-emerald-500">GitStats</b>&nbsp;&ndash; GitHub Repository Viewer
        </h1>
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex gap-2">
          <Input
            type="text"
            placeholder="Enter GitHub repository URL (e.g., https://github.com/marvinpoo/gitstats)"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : <Search className="h-4 w-4 mr-2" />}
            {isLoading ? "" : "View"}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4 w-full max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <Card className="mb-8 w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">GitHub API Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <TokenInput />
        </CardContent>
      </Card>

      <div className="flex justify-center mb-8">
        <a 
          href="https://github.com/marvinpoo/gitstats" 
          className="inline-flex items-center justify-center p-4 text-base font-medium text-white rounded-md bg-emerald-950 hover:bg-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="w-5 h-5 mr-3 text-emerald-400" />
          <span>View <kbd className="px-2 py-1.5 text-xs font-semibold text-emerald-600 bg-neutral-100 border border-emerald-500 rounded-lg dark:bg-emerald-600 dark:text-neutral-100 dark:border-emerald-500">GitStats</kbd> on GitHub</span>
          <svg className="w-4 h-4 ml-2 rtl:rotate-180 text-emerald-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
          </svg>
        </a>
      </div>

      <div className="text-center p-8 border rounded-md bg-muted/30">
        <h2 className="text-xl font-bold mb-4">How to Use</h2>
        <p className="mb-4">Enter a GitHub repository URL to view its details and get embeddable widgets.</p>

        <h3 className="font-medium mt-6 mb-2">Embeddable URL Format with Theme Support</h3>
        <ul className="space-y-2 text-sm max-w-xl mx-auto text-left">
          <li>
            <code>
              {domainUrl}{"{owner}"}/{"{repo}"}/embed/all/{"{refreshSeconds}"}/{"{theme}"}
            </code>{" "}
            - All repository data
          </li>
          <li>
            <code>
              {domainUrl}{"{owner}"}/{"{repo}"}/embed/commits/{"{refreshSeconds}"}/{"{amount}"}/{"{theme}"}
            </code>{" "}
            - Recent commits
          </li>
          <li>
            <code>
              {domainUrl}{"{owner}"}/{"{repo}"}/embed/issues/{"{refreshSeconds}"}/{"{amount}"}/{"{theme}"}
            </code>{" "}
            - Recent issues
          </li>
          <li>
            <code>
              {domainUrl}{"{owner}"}/{"{repo}"}/embed/stats/{"{refreshSeconds}"}/{"{theme}"}
            </code>{" "}
            - Repository stats
          </li>
        </ul>

        <div className="mt-4 p-4 bg-muted rounded-md text-left max-w-xl mx-auto">
          <h4 className="font-medium mb-2">Theme Options</h4>
          <ul className="space-y-1 text-sm">
            <li>
              <code>light</code> - Light theme (default)
            </li>
            <li>
              <code>dark</code> - Dark theme with neutral colors and bright accents
            </li>
            <li>
              <code>retro</code> - Pixelated glitchy 32-bit inspired theme
            </li>
          </ul>

          <h4 className="font-medium mt-4 mb-2">Examples</h4>
          <div className="space-y-2 text-xs">
            <p>Dark mode stats widget that refreshes every minute:</p>
            <code className="block p-2 bg-background rounded border">
              &lt;iframe src="{domainUrl}/marvinpoo/gitstats/embed/stats/60/dark" width="300" height="200"
              frameborder="0"&gt;&lt;/iframe&gt;
            </code>

            <p>Retro mode commits widget showing 5 commits that refresh every 30 seconds:</p>
            <code className="block p-2 bg-background rounded border">
              &lt;iframe src="{domainUrl}/marvinpoo/gitstats/embed/commits/30/5/retro" width="400" height="300"
              frameborder="0"&gt;&lt;/iframe&gt;
            </code>
          </div>
        </div>
      </div>
    </main>
  )
}

