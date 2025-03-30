"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import RepoInfo from "@/components/repo-info"
import CommitsList from "@/components/commits-list"
import IssuesList from "@/components/issues-list"

export default function AllEmbed({
  params,
}: {
  params: {
    owner: string
    repo: string
    refresh: string
  }
}) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const refreshInterval = Number.parseInt(params.refresh) || 60 // Default to 60 seconds

  const refreshData = () => {
    setLastUpdated(new Date())
  }

  useEffect(() => {
    // Initial load
    setLoading(false)

    // Set up auto-refresh based on the URL parameter
    const intervalId = setInterval(() => {
      refreshData()
    }, refreshInterval * 1000)

    return () => clearInterval(intervalId)
  }, [refreshInterval])

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center p-4">
        <AlertCircle className="mr-2" />
        <p>Error: {error}</p>
      </div>
    )
  }

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

      <Card className="mb-4">
        <CardContent className="p-4">
          <RepoInfo owner={params.owner} repo={params.repo} key={`repo-${lastUpdated.getTime()}`} compact={true} />
        </CardContent>
      </Card>

      <Tabs defaultValue="commits">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="commits" className="flex-1">
            Commits
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex-1">
            Issues
          </TabsTrigger>
        </TabsList>
        <TabsContent value="commits">
          <CommitsList
            owner={params.owner}
            repo={params.repo}
            key={`commits-${lastUpdated.getTime()}`}
            limit={3}
            compact={true}
          />
        </TabsContent>
        <TabsContent value="issues">
          <IssuesList
            owner={params.owner}
            repo={params.repo}
            key={`issues-${lastUpdated.getTime()}`}
            limit={3}
            compact={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

