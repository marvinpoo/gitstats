"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, MessageSquare, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToken } from "@/components/token-provider"
import { fetchWithAuth, getRateLimitInfo } from "@/lib/github"

interface IssuesListProps {
  owner: string
  repo: string
  limit?: number
  compact?: boolean
}

interface Issue {
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

export default function IssuesList({ owner, repo, limit = 10, compact = false }: IssuesListProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimit, setRateLimit] = useState<{
    remaining: number | null
    limit: number | null
    reset: Date | null
  } | null>(null)
  const { token } = useToken()

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=${limit}`,
          token,
        )

        // Get rate limit info
        const rateLimitInfo = getRateLimitInfo(response)
        setRateLimit(rateLimitInfo)

        if (!response.ok) {
          throw new Error(`Failed to fetch issues: ${response.statusText}`)
        }

        const data = await response.json()
        // Filter out pull requests which are also returned by the issues endpoint
        const issuesOnly = data.filter((issue: any) => !issue.pull_request)
        setIssues(issuesOnly)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchIssues()
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
        <p>Error loading issues: {error}</p>
      </div>
    )
  }

  if (issues.length === 0) {
    return <p className="text-center p-4">No open issues found for this repository.</p>
  }

  return (
    <>
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
        {issues.map((issue) => (
          <div key={issue.id} className="flex gap-4 items-start border-b pb-4">
            <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
              <AvatarImage src={issue.user.avatar_url} alt={issue.user.login} />
              <AvatarFallback>{issue.user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <a
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium hover:underline ${compact ? "line-clamp-1 text-sm" : "line-clamp-2"}`}
              >
                #{issue.number} {issue.title}
              </a>

              <div className="flex flex-wrap gap-1 mt-2">
                {issue.labels.slice(0, compact ? 2 : 3).map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className="text-xs py-0"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      borderColor: `#${label.color}`,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
                {issue.labels.length > (compact ? 2 : 3) && (
                  <Badge variant="outline" className="text-xs py-0">
                    +{issue.labels.length - (compact ? 2 : 3)} more
                  </Badge>
                )}
              </div>

              <div className={`flex items-center ${compact ? "text-xs" : "text-sm"} text-muted-foreground mt-2`}>
                <span>
                  Opened by{" "}
                  <a href={issue.user.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {issue.user.login}
                  </a>
                </span>
                <span className="mx-2">{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                {issue.comments > 0 && (
                  <span className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {issue.comments}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

