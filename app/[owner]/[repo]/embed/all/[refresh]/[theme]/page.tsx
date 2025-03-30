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
import ThemeScript from "../../../theme-script"

export default function AllEmbed({
  params,
}: {
  params: {
    owner: string
    repo: string
    refresh: string
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

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const refreshInterval = Number.parseInt(params.refresh) || 0 // Default to no refresh
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

  const refreshData = () => {
    setLastUpdated(new Date())
  }

  useEffect(() => {
    // Check for token in localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("github-token")
      if (token) {
        console.log("Using GitHub token for authentication")
      }
    }
  }, [])

  useEffect(() => {
    // Initial load
    setLoading(false)

    // Set up auto-refresh based on the URL parameter
    let intervalId: NodeJS.Timeout | undefined

    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        refreshData()
      }, refreshInterval * 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
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
      <ThemeScript theme={theme} />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold">
          {params.owner}/{params.repo}
        </h2>
        <span className="text-sm text-muted-foreground">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </span>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <RepoInfo owner={params.owner} repo={params.repo} key={`repo-${lastUpdated.getTime()}`} compact={true} />
        </CardContent>
      </Card>

      <Tabs defaultValue="commits">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="commits" className="flex-1 text-base">
            Commits
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex-1 text-base">
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

