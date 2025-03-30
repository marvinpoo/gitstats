"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToken } from "@/components/token-provider"
import { AlertCircle, Key, Check, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function TokenInput() {
  const { token, setToken } = useToken()
  const [inputToken, setInputToken] = useState(token || "")
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const validateToken = async () => {
    if (!inputToken.trim()) {
      setToken(null)
      setIsValid(null)
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${inputToken}`,
        },
      })

      if (response.ok) {
        setToken(inputToken)
        setIsValid(true)
        setError(null)
      } else {
        setIsValid(false)
        if (response.status === 401) {
          setError("Invalid token. Please check and try again.")
        } else {
          setError(`Error validating token: ${response.statusText}`)
        }
        setToken(null)
      }
    } catch (err) {
      setIsValid(false)
      setError("Error connecting to GitHub. Please try again.")
      setToken(null)
    } finally {
      setIsValidating(false)
    }
  }

  const clearToken = () => {
    setInputToken("")
    setToken(null)
    setIsValid(null)
    setError(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="password"
          placeholder="Enter GitHub personal access token"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          className="flex-1"
        />
        <Button onClick={validateToken} disabled={isValidating} variant="outline">
          {isValidating ? "Validating..." : "Save"}
        </Button>
        {token && (
          <Button onClick={clearToken} variant="outline" size="icon">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isValid === true && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200 py-2">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>Token validated successfully!</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground">
        <p className="flex items-center">
          <Key className="h-4 w-4 mr-1" />
          Add a GitHub personal access token to increase API rate limits from 60 to 5,000 requests per hour.
        </p>
        <p className="mt-1 text-xs">
          Create a token with <code>public_repo</code> scope at{" "}
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            github.com/settings/tokens
          </a>
        </p>
      </div>
    </div>
  )
}

