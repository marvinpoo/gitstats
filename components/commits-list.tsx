"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, GitCommit, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToken } from "@/components/token-provider"
import { fetchWithAuth, getRateLimitInfo } from "@/lib/github"

interface CommitsListProps {
  owner: string
  repo: string
  limit?: number
  compact?: boolean
}

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

export default function CommitsList({ owner, repo, limit = 10, compact = false }: CommitsListProps) {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimit, setRateLimit] = useState<{
    remaining: number | null
    limit: number | null
    reset: Date | null
  } | null>(null)
  const { token } = useToken()

  useEffect(() => {
    const fetchCommits = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
          token,
        )

        // Get rate limit info
        const rateLimitInfo = getRateLimitInfo(response)
        setRateLimit(rateLimitInfo)

        if (!response.ok) {
          throw new Error(`Failed to fetch commits: ${response.statusText}`)
        }

        const data = await response.json()
        setCommits(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCommits()
  }, [owner, repo, limit, token])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(Math.min(limit, 5))].map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <Skeleton className={`${compact ? "h-8 w-8" : "h-10 w-10"} rounded-full`} />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
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
        <p>Error loading commits: {error}</p>
      </div>
    )
  }

  if (commits.length === 0) {
    return <p className="text-center p-4">No commits found for this repository.</p>
  }

  return (
    <div className="space-y-4">
      {rateLimit && rateLimit.remaining !== null && rateLimit.remaining < 10 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-md flex items-center text-sm mb-4">
          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
          <span>
            API rate limit: {rateLimit.remaining} / {rateLimit.limit} requests remaining.
            {rateLimit.reset && <span> Resets {formatDistanceToNow(rateLimit.reset, { addSuffix: true })}</span>}
          </span>
        </div>
      )}

      {commits.map((commit) => (
        <div key={commit.sha} className="flex gap-4 items-start border-b pb-4">
          <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
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
              className={`font-medium hover:underline ${compact ? "line-clamp-1 text-sm" : "line-clamp-2"}`}
            >
              {commit.commit.message}
            </a>

            <div className={`flex items-center ${compact ? "text-xs" : "text-sm"} text-muted-foreground mt-1`}>
              <GitCommit className="mr-1 h-3 w-3" />
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
    </div>
  )
}

