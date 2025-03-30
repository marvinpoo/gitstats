"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

export default function IssuesEmbed({ params }: { params: { owner: string; repo: string } }) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchIssues = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://api.github.com/repos/${params.owner}/${params.repo}/issues?state=open&per_page=3`,
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.statusText}`)
      }

      const data = await response.json()
      // Filter out pull requests which are also returned by the issues endpoint
      const issuesOnly = data.filter((issue: any) => !issue.pull_request)
      setIssues(issuesOnly.slice(0, 3))
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

    // Set up auto-refresh every 60 seconds
    const intervalId = setInterval(() => {
      fetchIssues()
    }, 60000)

    return () => clearInterval(intervalId)
  }, [params.owner, params.repo])

  if (loading && issues.length === 0) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <Skeleton className="h-8 w-8 rounded-full" />
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
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-bold">Recent Issues</h2>
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </span>
      </div>

      {issues.map((issue) => (
        <div key={issue.id} className="flex gap-4 items-start border-b pb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={issue.user.avatar_url} alt={issue.user.login} />
            <AvatarFallback>{issue.user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <a
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline line-clamp-1 text-sm"
            >
              #{issue.number} {issue.title}
            </a>

            <div className="flex flex-wrap gap-1 mt-1">
              {issue.labels.slice(0, 2).map((label) => (
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
              {issue.labels.length > 2 && (
                <Badge variant="outline" className="text-xs py-0">
                  +{issue.labels.length - 2} more
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              Opened {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

