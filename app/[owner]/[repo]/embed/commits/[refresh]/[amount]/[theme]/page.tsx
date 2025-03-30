"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, GitCommit } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fetchWithAuth } from "@/lib/github"
import ThemeScript from "../../../../theme-script"

interface Commit {
  sha: string
  html_url: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
    html_url: string
  } | null
}

export default function CommitsEmbed({
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

  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const refreshInterval = Number.parseInt(params.refresh) || 0 // Default to no refresh
  const amount = Number.parseInt(params.amount) || 3 // Default to 3 commits
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

  const fetchCommits = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get token from localStorage if available
      let token = null
      if (typeof window !== "undefined") {
        token = localStorage.getItem("github-token")
      }

      const response = await fetchWithAuth(
        `https://api.github.com/repos/${params.owner}/${params.repo}/commits?per_page=${amount}`,
        token,
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch commits: ${response.statusText}`)
      }

      const data = await response.json()
      setCommits(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommits()

    // Set up auto-refresh based on the URL parameter
    let intervalId: NodeJS.Timeout | undefined

    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchCommits()
      }, refreshInterval * 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [params.owner, params.repo, amount, refreshInterval])

  return (
    <div className="p-4 space-y-4">
      <ThemeScript theme={theme} />
      {loading && commits.length === 0 ? (
        <div className="space-y-4">
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
      ) : error ? (
        <div className="text-red-500 flex items-center p-4">
          <AlertCircle className="mr-2" />
          <p>Error loading commits: {error}</p>
        </div>
      ) : commits.length === 0 ? (
        <p className="text-center p-4">No commits found for this repository.</p>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-bold">Recent Commits</h2>
            <span className="text-sm text-muted-foreground">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          </div>

          {commits.map((commit) => (
            <div key={commit.sha} className="flex gap-4 items-start border-b pb-4 border-border">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={commit.author?.avatar_url || "/placeholder.svg?height=40&width=40"}
                  alt={commit.author?.login || commit.commit.author.name}
                />
                <AvatarFallback>
                  {(commit.author?.login || commit.commit.author.name || "").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <a
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline line-clamp-1 text-base"
                >
                  {commit.commit.message}
                </a>

                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <GitCommit className="mr-1 h-4 w-4" />
                  <span className="mr-2">{commit.sha.substring(0, 7)}</span>
                  <span>
                    by{" "}
                    {commit.author ? (
                      <a
                        href={commit.author.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {commit.author.login}
                      </a>
                    ) : (
                      commit.commit.author.name
                    )}
                  </span>
                  <span className="ml-2">
                    {formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

