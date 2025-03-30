"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, GitPullRequest, MessageSquare, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToken } from "@/components/token-provider"
import { fetchWithAuth, getRateLimitInfo } from "@/lib/github"

interface PullRequestsListProps {
  owner: string
  repo: string
}

interface PullRequest {
  id: number
  number: number
  title: string
  html_url: string
  state: string
  created_at: string
  updated_at: string
  comments: number
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

export default function PullRequestsList({ owner, repo }: PullRequestsListProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimit, setRateLimit] = useState<{
    remaining: number | null
    limit: number | null
    reset: Date | null
  } | null>(null)
  const { token } = useToken()

  useEffect(() => {
    const fetchPullRequests = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=10`,
          token,
        )

        // Get rate limit info
        const rateLimitInfo = getRateLimitInfo(response)
        setRateLimit(rateLimitInfo)

        if (!response.ok) {
          throw new Error(`Failed to fetch pull requests: ${response.statusText}`)
        }

        const data = await response.json()
        setPullRequests(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPullRequests()
  }, [owner, repo, token])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <Skeleton className="h-10 w-10 rounded-full" />
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
        <p>Error loading pull requests: {error}</p>
      </div>
    )
  }

  if (pullRequests.length === 0) {
    return <p className="text-center p-4">No open pull requests found for this repository.</p>
  }

  return (
    <div>
      {rateLimit && rateLimit.remaining !== null && rateLimit.remaining < 10 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-md flex items-center text-sm mb-4">
          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
          <span>
            API rate limit: {rateLimit.remaining} / {rateLimit.limit} requests remaining.
            {rateLimit.reset && <span> Resets {formatDistanceToNow(rateLimit.reset, { addSuffix: true })}</span>}
          </span>
        </div>
      )}
      <div className="space-y-4">
        {pullRequests.map((pr) => (
          <div key={pr.id} className="flex gap-4 items-start border-b pb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={pr.user.avatar_url} alt={pr.user.login} />
              <AvatarFallback>{pr.user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <a
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline line-clamp-2"
              >
                <span className="flex items-center">
                  <GitPullRequest className="h-4 w-4 mr-2 text-green-500" />#{pr.number} {pr.title}
                </span>
              </a>

              <div className="flex flex-wrap gap-2 mt-2">
                {pr.labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      borderColor: `#${label.color}`,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <span>
                  Opened by{" "}
                  <a href={pr.user.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {pr.user.login}
                  </a>
                </span>
                <span className="mx-2">{formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}</span>
                {pr.comments > 0 && (
                  <span className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {pr.comments}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

