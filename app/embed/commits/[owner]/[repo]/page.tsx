"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, GitCommit } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

export default function CommitsEmbed({ params }: { params: { owner: string; repo: string } }) {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchCommits = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/commits?per_page=3`)

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

    // Set up auto-refresh every 60 seconds
    const intervalId = setInterval(() => {
      fetchCommits()
    }, 60000)

    return () => clearInterval(intervalId)
  }, [params.owner, params.repo])

  if (loading && commits.length === 0) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
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
        <p>Error loading commits: {error}</p>
      </div>
    )
  }

  if (commits.length === 0) {
    return <p className="text-center p-4">No commits found for this repository.</p>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-bold">Recent Commits</h2>
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </span>
      </div>

      {commits.slice(0, 3).map((commit) => (
        <div key={commit.sha} className="flex gap-4 items-start border-b pb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={commit.author?.avatar_url || "/placeholder.svg?height=32&width=32"}
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
              className="font-medium hover:underline line-clamp-1 text-sm"
            >
              {commit.commit.message}
            </a>

            <div className="flex items-center text-xs text-muted-foreground mt-1">
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

