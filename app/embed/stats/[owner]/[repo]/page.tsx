"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Star, GitFork, Eye, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface RepoStats {
  name: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  updated_at: string
  subscribers_count: number
}

export default function StatsEmbed({ params }: { params: { owner: string; repo: string } }) {
  const [stats, setStats] = useState<RepoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}`)

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

    // Set up auto-refresh every 60 seconds
    const intervalId = setInterval(() => {
      fetchStats()
    }, 60000)

    return () => clearInterval(intervalId)
  }, [params.owner, params.repo])

  if (loading && !stats) {
    return (
      <div className="p-4 grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center p-4">
        <AlertCircle className="mr-2" />
        <p>Error loading repository stats: {error}</p>
      </div>
    )
  }

  if (!stats) {
    return <p className="text-center p-4">No stats found for this repository.</p>
  }

  const statItems = [
    {
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      label: "Stars",
      value: stats.stargazers_count.toLocaleString(),
    },
    { icon: <GitFork className="h-5 w-5 text-blue-500" />, label: "Forks", value: stats.forks_count.toLocaleString() },
    {
      icon: <MessageSquare className="h-5 w-5 text-red-500" />,
      label: "Issues",
      value: stats.open_issues_count.toLocaleString(),
    },
    {
      icon: <Eye className="h-5 w-5 text-green-500" />,
      label: "Watchers",
      value: stats.watchers_count.toLocaleString(),
    },
  ]

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold">
          {params.owner}/{params.repo}
        </h2>
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="mb-1">{item.icon}</div>
              <div className="text-xl font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

