"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Star, GitFork, Eye, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fetchWithAuth } from "@/lib/github"
import ThemeScript from "../../../theme-script"

interface RepoStats {
  name: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  updated_at: string
  subscribers_count: number
}

export default function StatsEmbed({
  params,
}: {
  params: {
    owner: string
    repo: string
    refresh: string
    theme: string
  }
}) {
  // Apply theme immediately during render
  if (typeof document !== "undefined") {
    if (params.theme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.style.colorScheme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = "light"
    }
  }

  const [stats, setStats] = useState<RepoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const refreshInterval = Number.parseInt(params.refresh) || 0 // Default to no refresh
  const theme = params.theme || "light" // Default to light theme

  // Force theme directly on HTML element - server-side compatible
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.style.colorScheme = "dark"
      document.documentElement.dataset.theme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = "light"
      document.documentElement.dataset.theme = "light"
    }
  }, [theme])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get token from localStorage if available
      let token = null
      if (typeof window !== "undefined") {
        token = localStorage.getItem("github-token")
      }

      const response = await fetchWithAuth(`https://api.github.com/repos/${params.owner}/${params.repo}`, token)

      if (!response.ok) {
        throw new Error(`Failed to fetch repository data: ${response.statusText}`)
      }

      const data = await response.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Set up auto-refresh based on the URL parameter
    let intervalId: NodeJS.Timeout | undefined

    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchStats()
      }, refreshInterval * 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [params.owner, params.repo, refreshInterval])

  return (
    <div className="p-4">
      <ThemeScript theme={theme} />
      {loading && !stats ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 flex items-center p-4">
          <AlertCircle className="mr-2 h-5 w-5" />
          <p className="text-base">Error loading repository stats: {error}</p>
        </div>
      ) : !stats ? (
        <p className="text-center p-4 text-base">No stats found for this repository.</p>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold">
              {params.owner}/{params.repo}
            </h2>
            <span className="text-sm text-muted-foreground">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: <Star className="h-6 w-6 text-amber-500" />,
                label: "Stars",
                value: stats.stargazers_count.toLocaleString(),
              },
              {
                icon: <GitFork className="h-6 w-6 text-cyan-500" />,
                label: "Forks",
                value: stats.forks_count.toLocaleString(),
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-rose-500" />,
                label: "Issues",
                value: stats.open_issues_count.toLocaleString(),
              },
              {
                icon: <Eye className="h-6 w-6 text-emerald-500" />,
                label: "Watchers",
                value: stats.watchers_count.toLocaleString(),
              },
            ].map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="mb-2">{item.icon}</div>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

