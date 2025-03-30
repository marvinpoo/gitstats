export async function fetchWithAuth(url: string, token: string | null) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  }

  if (token) {
    headers["Authorization"] = `token ${token}`
  }

  return fetch(url, { headers })
}

export function getRateLimitInfo(response: Response) {
  const remaining = response.headers.get("X-RateLimit-Remaining")
  const limit = response.headers.get("X-RateLimit-Limit")
  const reset = response.headers.get("X-RateLimit-Reset")

  return {
    remaining: remaining ? Number.parseInt(remaining) : null,
    limit: limit ? Number.parseInt(limit) : null,
    reset: reset ? new Date(Number.parseInt(reset) * 1000) : null,
  }
}

