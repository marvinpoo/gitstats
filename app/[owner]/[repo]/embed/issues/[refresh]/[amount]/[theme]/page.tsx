"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fetchWithAuth } from "@/lib/github"
import ThemeScript from "../../../../theme-script"

interface Issue {
  id: number
  number: number
  title: string
  html_url: string
  state: string
  created_at: string
  updated_at: string
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  labels: {
    id: number
    name: string
    color: string
  }[]
}

export default function IssuesEmbed({
  params,
}: {
  params: {
    owner: string
    repo: string
    refresh: string
    amount: string
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

  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const refreshInterval = Number.parseInt(params.refresh) || 0 // Default to no refresh
  const amount = Number.parseInt(params.amount) || 3 // Default to 3 issues
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

  const fetchIssues = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get token from localStorage if available
      let token = null
      if (typeof window !== "undefined") {
        token = localStorage.getItem("github-token")
      }

      const response = await fetchWithAuth(
        `https://api.github.com/repos/${params.owner}/${params.repo}/issues?state=open&per_page=${amount}`,
        token,
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.statusText}`)
      }

      const data = await response.json()
      // Filter out pull requests which are also returned by the issues endpoint
      const issuesOnly = data.filter((issue: any) => !issue.pull_request)
      setIssues(issuesOnly.slice(0, amount))
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIssues()

    // Set up auto-refresh based on the URL parameter
    let intervalId: NodeJS.Timeout | undefined

    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchIssues()
      }, refreshInterval * 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [params.owner, params.repo, amount, refreshInterval])

  if (loading && issues.length === 0) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(amount)].map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center p-4">
        <AlertCircle className="mr-2" />
        <p>Error loading issues: {error}</p>
      </div>
    )
  }

  if (issues.length === 0) {
    return <p className="text-center p-4">No open issues found for this repository.</p>
  }

  return (
    <div className="p-4 space-y-4">
      <ThemeScript theme={theme} />
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-bold">Recent Issues</h2>
        <span className="text-sm text-muted-foreground">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </span>
      </div>

      {issues.map((issue) => (
        <div key={issue.id} className="flex gap-4 items-start border-b pb-4 border-border">
          <Avatar className="h-10 w-10">
            <AvatarImage src={issue.user.avatar_url} alt={issue.user.login} />
            <AvatarFallback>{issue.user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <a
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline line-clamp-1 text-base"
            >
              #{issue.number} {issue.title}
            </a>

            <div className="flex flex-wrap gap-1 mt-1">
              {issue.labels.slice(0, 2).map((label) => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className="text-sm py-0"
                  style={{
                    backgroundColor: `#${label.color}20`,
                    borderColor: `#${label.color}`,
                    color: `#${label.color}`,
                  }}
                >
                  {label.name}
                </Badge>
              ))}
              {issue.labels.length > 2 && (
                <Badge variant="outline" className="text-sm py-0">
                  +{issue.labels.length - 2} more
                </Badge>
              )}
            </div>

            <div className="text-sm text-muted-foreground mt-1">
              Opened {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

