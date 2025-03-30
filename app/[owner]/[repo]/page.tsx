"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Github, RefreshCw, Gamepad2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import RepoInfo from "@/components/repo-info"
import CommitsList from "@/components/commits-list"
import IssuesList from "@/components/issues-list"
import PullRequestsList from "@/components/pull-requests-list"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

export default function RepositoryPage({ params }: { params: { owner: string; repo: string } }) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { theme, setTheme } = useTheme()
  const [embedTheme, setEmbedTheme] = useState(theme || "light")
  const [embedRefresh, setEmbedRefresh] = useState(90) // Default to 60 seconds

  useEffect(() => {
    // Initial validation of the repository
    const validateRepo = async () => {
      try {
        // Get token from context
        const token = localStorage.getItem("github-token")

        const headers: HeadersInit = {
          Accept: "application/vnd.github.v3+json",
        }

        if (token) {
          headers["Authorization"] = `token ${token}`
        }

        const response = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}`, {
          headers,
        })

        if (!response.ok) {
          throw new Error(`Repository not found: ${response.statusText}`)
        }
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Repository not found")
        setIsLoading(false)
      }
    }

    validateRepo()
  }, [params.owner, params.repo])

  // Update embedTheme when theme changes
  useEffect(() => {
    if (theme) {
      setEmbedTheme(theme)
    }
  }, [theme])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setLastRefreshed(new Date())
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Auto-refresh effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (autoRefresh) {
      intervalId = setInterval(() => {
        handleRefresh()
      }, refreshInterval * 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh, refreshInterval])

  // Generate embed URLs
  // Add this near the top of the component with other state variables
  const [domainUrl, setDomainUrl] = useState("")
  
  // Add this effect to get the domain URL when the component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomainUrl(window.location.origin + "/")
    }
  }, [])
  
  const getEmbedUrl = (type: string, refreshSecs: number = embedRefresh, amount = 3) => {
    const baseUrl = `${domainUrl}${params.owner}/${params.repo}/embed/${type}/${refreshSecs}`
    if (type === "commits" || type === "issues") {
      return `${baseUrl}/${amount}/${embedTheme}`
    }
    return `${baseUrl}/${embedTheme}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-6xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <main className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Github className="mr-2 h-8 w-8" /> {params.owner}/{params.repo}
        </h1>
        <Select value={theme} onValueChange={(value) => setTheme(value)} aria-label="Select theme">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select theme">
              <div className="flex items-center">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 mr-2" />
                ) : theme === "light" ? (
                  <Sun className="h-4 w-4 mr-2" />
                ) : theme === "retro" ? (
                  <Gamepad2 className="h-4 w-4 mr-2" />
                ) : (
                  <span className="mr-2">🖥️</span>
                )}
                {theme === "dark" ? "Dark" : theme === "light" ? "Light" : theme === "retro" ? "Retro" : "System"}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">
              <div className="flex items-center">
                <Sun className="h-4 w-4 mr-2" />
                Light
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center">
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </div>
            </SelectItem>
            <SelectItem value="retro">
              <div className="flex items-center">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Retro
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="w-full mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="mr-4">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {lastRefreshed && (
                <span className="text-sm text-muted-foreground">
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <Label htmlFor="auto-refresh">Auto-refresh</Label>
              </div>
              {autoRefresh && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="refresh-interval">Every</Label>
                  <Select
                    value={refreshInterval.toString()}
                    onValueChange={(value) => setRefreshInterval(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 sec</SelectItem>
                      <SelectItem value="30">30 sec</SelectItem>
                      <SelectItem value="60">1 min</SelectItem>
                      <SelectItem value="90">90 sec</SelectItem>
                      <SelectItem value="300">5 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <RepoInfo owner={params.owner} repo={params.repo} key={`repo-${lastRefreshed?.getTime()}`} />

          <Tabs defaultValue="commits" className="mt-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="commits">Commits</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="pulls">Pull Requests</TabsTrigger>
            </TabsList>
            <TabsContent value="commits">
              <CommitsList owner={params.owner} repo={params.repo} key={`commits-${lastRefreshed?.getTime()}`} />
            </TabsContent>
            <TabsContent value="issues">
              <IssuesList owner={params.owner} repo={params.repo} key={`issues-${lastRefreshed?.getTime()}`} />
            </TabsContent>
            <TabsContent value="pulls">
              <PullRequestsList owner={params.owner} repo={params.repo} key={`pulls-${lastRefreshed?.getTime()}`} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Embeddable Views</h2>
          <p className="mb-4">Use these URLs to embed specific views of this repository in iframes:</p>

          <div className="mb-6 space-y-4">
            <div>
              <h3 className="font-medium mb-2">Embed Theme</h3>
              <div className="flex items-center gap-4">
                <Select value={embedTheme} onValueChange={setEmbedTheme} aria-label="Select embed theme">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select embed theme">
                      <div className="flex items-center">
                        {embedTheme === "dark" ? (
                          <Moon className="h-4 w-4 mr-2" />
                        ) : embedTheme === "retro" ? (
                          <Gamepad2 className="h-4 w-4 mr-2" />
                        ) : (
                          <Sun className="h-4 w-4 mr-2" />
                        )}
                        {embedTheme === "dark" ? "Dark" : embedTheme === "retro" ? "Retro" : "Light"}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="retro">
                      <div className="flex items-center">
                        <Gamepad2 className="h-4 w-4 mr-2" />
                        Retro
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Select the theme for your embedded widgets.</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Refresh Interval</h3>
              <div className="flex items-center gap-4">
                <Select
                  value={embedRefresh.toString()}
                  onValueChange={(value) => setEmbedRefresh(Number.parseInt(value))}
                  aria-label="Select refresh interval"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select refresh interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No auto-refresh</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="90">90 seconds</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Set how often the embedded widgets should refresh, <b>in seconds</b>. Use 0 to prevent rate limiting.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-medium">All Repository Data</h3>
              <code className="block p-2 bg-muted rounded text-xs break-all">{getEmbedUrl("all")}</code>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(getEmbedUrl("all"))}>
                Copy URL
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Recent Commits</h3>
              <code className="block p-2 bg-muted rounded text-xs break-all">{getEmbedUrl("commits")}</code>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(getEmbedUrl("commits"))}>
                Copy URL
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Recent Issues</h3>
              <code className="block p-2 bg-muted rounded text-xs break-all">{getEmbedUrl("issues")}</code>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(getEmbedUrl("issues"))}>
                Copy URL
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Repository Stats</h3>
              <code className="block p-2 bg-muted rounded text-xs break-all">{getEmbedUrl("stats")}</code>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(getEmbedUrl("stats"))}>
                Copy URL
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 border rounded-md bg-muted/30">
            <h3 className="font-medium mb-2">URL Format</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <code>
                  {domainUrl}{"{owner}"}/{"{repo}"}/embed/all/{"{refreshSeconds}"}/{"{theme}"}
                </code>{" "}
                - All repository data
              </li>
              <li>
                <code>
                  {domainUrl}{"{owner}"}/{"{repo}"}/embed/commits/{"{refreshSeconds}"}/{"{amount}"}/{"{theme}"}
                </code>{" "}
                - Recent commits
              </li>
              <li>
                <code>
                  {domainUrl}{"{owner}"}/{"{repo}"}/embed/issues/{"{refreshSeconds}"}/{"{amount}"}/{"{theme}"}
                </code>{" "}
                - Recent issues
              </li>
              <li>
                <code>
                  {domainUrl}{"{owner}"}/{"{repo}"}/embed/stats/{"{refreshSeconds}"}/{"{theme}"}
                </code>{" "}
                - Repository stats
              </li>
            </ul>
            <p className="mt-2 text-sm">
              <strong>Available themes:</strong> <code>light</code>, <code>dark</code>, <code>retro</code>
              <br />
              <strong>Refresh seconds:</strong> Use <code>0</code> for no auto-refresh (prevents rate limiting)
            </p>

            <div className="mt-4 p-3 bg-background rounded-md border">
              <h4 className="font-medium mb-2">Example iframe code:</h4>
              <code className="block text-xs">
                &lt;iframe src="{getEmbedUrl("stats")}" width="300" height="200" frameborder="0"&gt;&lt;/iframe&gt;
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

