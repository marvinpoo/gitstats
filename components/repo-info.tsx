"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Star, GitFork, Eye, AlertCircle, Calendar, Users, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToken } from "@/components/token-provider"
import { fetchWithAuth, getRateLimitInfo } from "@/lib/github"

interface RepoInfoProps {
  owner: string
  repo: string
  compact?: boolean
}

interface RepoData {
  name: string
  full_name: string
  description: string
  html_url: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  created_at: string
  updated_at: string
  language: string
  topics: string[]
  owner: {
    avatar_url: string
    login: string
    html_url: string
  }
}

export default function RepoInfo({ owner, repo, compact = false }: RepoInfoProps) {
  const [repoInfo, setRepoInfo] = useState<RepoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimit, setRateLimit] = useState<{
    remaining: number | null
    limit: number | null
    reset: Date | null
  } | null>(null)
  const { token } = useToken()

  useEffect(() => {
    const fetchRepoInfo = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchWithAuth(`https://api.github.com/repos/${owner}/${repo}`, token)

        // Get rate limit info
        const rateLimitInfo = getRateLimitInfo(response)
        setRateLimit(rateLimitInfo)

        if (!response.ok) {
          throw new Error(`Failed to fetch repository data: ${response.statusText}`)
        }

        const data = await response.json()
        setRepoInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRepoInfo()
  }, [owner, repo, token])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center">
        <AlertCircle className="mr-2" />
        <p>Error loading repository information: {error}</p>
      </div>
    )
  }

  if (!repoInfo) {
    return null
  }

  if (compact) {
    return (
      <div>
        {rateLimit && rateLimit.remaining !== null && rateLimit.remaining < 10 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-md flex items-center text-xs mb-3">
            <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
            <span>API rate limit: {rateLimit.remaining} remaining</span>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <img
            src={repoInfo.owner.avatar_url || "/placeholder.svg"}
            alt={`${repoInfo.owner.login}'s avatar`}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <h2 className="text-base font-bold">
              <a href={repoInfo.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {repoInfo.full_name}
              </a>
            </h2>
            {repoInfo.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{repoInfo.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {repoInfo.language && (
            <Badge variant="outline" className="text-xs">
              {repoInfo.language}
            </Badge>
          )}
          {repoInfo.topics &&
            repoInfo.topics.slice(0, 2).map((topic) => (
              <Badge key={topic} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
        </div>

        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="flex flex-col items-center">
            <Star className="h-5 w-5 text-yellow-500 mb-1" />
            <div className="font-medium">{repoInfo.stargazers_count.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Stars</div>
          </div>
          <div className="flex flex-col items-center">
            <GitFork className="h-5 w-5 text-blue-500 mb-1" />
            <div className="font-medium">{repoInfo.forks_count.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Forks</div>
          </div>
          <div className="flex flex-col items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mb-1" />
            <div className="font-medium">{repoInfo.open_issues_count.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Issues</div>
          </div>
          <div className="flex flex-col items-center">
            <Eye className="h-5 w-5 text-green-500 mb-1" />
            <div className="font-medium">{repoInfo.watchers_count.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Watchers</div>
          </div>
        </div>
      </div>
    )
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

      <div className="flex items-center gap-4 mb-4">
        <img
          src={repoInfo.owner.avatar_url || "/placeholder.svg"}
          alt={`${repoInfo.owner.login}'s avatar`}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h2 className="text-2xl font-bold">
            <a href={repoInfo.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {repoInfo.full_name}
            </a>
          </h2>
          <p className="text-muted-foreground">{repoInfo.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {repoInfo.language && (
          <Badge variant="outline" className="text-xs">
            {repoInfo.language}
          </Badge>
        )}
        {repoInfo.topics &&
          repoInfo.topics.map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center">
            <Star className="mr-2 h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Stars</p>
              <p className="font-medium">{repoInfo.stargazers_count.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center">
            <GitFork className="mr-2 h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Forks</p>
              <p className="font-medium">{repoInfo.forks_count.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center">
            <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Issues</p>
              <p className="font-medium">{repoInfo.open_issues_count.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center">
            <Eye className="mr-2 h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Watchers</p>
              <p className="font-medium">{repoInfo.watchers_count.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="mr-1 h-4 w-4" />
          Created {formatDistanceToNow(new Date(repoInfo.created_at), { addSuffix: true })}
        </div>
        <div className="flex items-center">
          <Users className="mr-1 h-4 w-4" />
          <a
            href={`${repoInfo.html_url}/network/members`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {repoInfo.forks_count} contributors
          </a>
        </div>
      </div>
    </div>
  )
}

