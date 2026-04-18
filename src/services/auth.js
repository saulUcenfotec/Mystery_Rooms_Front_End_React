const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const AUTH_BASE_ROUTE = '/auth'
const AUTH_URL = `${API_BASE_URL}${AUTH_BASE_ROUTE}`
const LOGIN_ROUTE = `${AUTH_URL}/login`
const SIGNUP_ROUTE = `${AUTH_URL}/signup`

export const AUTH_STORAGE_KEY = 'MR_AUTH_SESSION'

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  let data = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text || null
  }

  if (!response.ok) {
    const message = typeof data === 'string'
      ? data
      : data?.message || `Request failed with status ${response.status}`

    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function loginUser(credentials) {
  const response = await request(LOGIN_ROUTE, {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    })
  })

  return {
    token: response.token,
    expiresIn: response.expiresIn,
    user: response.authUser
  }
}

export async function registerUser(payload) {
  return request(SIGNUP_ROUTE, {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      lastname: payload.lastname || '',
      email: payload.email,
      password: payload.password
    })
  })
}

export function saveAuthSession(session) {
  const expiresAt = Date.now() + (session.expiresIn || 0)
  const normalizedSession = {
    token: session.token,
    expiresAt,
    user: session.user
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedSession))
  return normalizedSession
}

export function loadAuthSession() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored)
    if (!parsed?.token || !parsed?.user) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function getAuthToken() {
  return loadAuthSession()?.token || null
}
