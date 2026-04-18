import { getAuthToken } from './auth.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

async function request(url, options = {}) {
  const token = getAuthToken()

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  })

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function saveUserSessionStats(userId, stats) {
  return request(`${API_BASE_URL}/users/${userId}/session-stats`, {
    method: 'POST',
    body: JSON.stringify({
      sessionElapsedSeconds: Math.max(0, Math.round(stats.sessionElapsedSeconds || 0)),
      totalSolveSeconds: Math.max(0, Math.round(stats.totalSolveSeconds || 0)),
      successes: Math.max(0, Math.round(stats.successes || 0)),
      failures: Math.max(0, Math.round(stats.failures || 0)),
      puzzlesSolved: Math.max(0, Math.round(stats.puzzlesSolved || 0))
    })
  })
}

export async function getUserStats(userId) {
  return request(`${API_BASE_URL}/users/${userId}/stats`)
}
