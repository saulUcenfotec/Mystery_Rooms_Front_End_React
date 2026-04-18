import { getAuthToken } from './auth.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const GAME_ROOMS_ROUTE = '/rooms'
const ROOMS_URL = `${API_BASE_URL}${GAME_ROOMS_ROUTE}`
const DEFAULT_ROOM_SYNC_STATE = {
  players: {},
  solvedPuzzles: []
}

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

export function buildRoomPayload(room = {}, overrides = {}) {
  return {
    id: room.id,
    roomName: room.roomName || '',
    playerCount: room.playerCount ?? 0,
    maxPlayers: room.maxPlayers ?? 1,
    difficulty: room.difficulty || 'normal',
    maxTime: room.maxTime ?? 60,
    isPrivate: room.isPrivate ?? false,
    accessCode: room.accessCode || null,
    activePlayers: room.activePlayers || null,
    description: room.description || '',
    status: room.status || 'WAITING',
    imgURL: room.imgURL || null,
    createdAt: room.createdAt || null,
    updatedAt: room.updatedAt || null,
    lastActivity: room.lastActivity ?? Date.now(),
    ...overrides
  }
}

function sanitizeRoomSyncState(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ...DEFAULT_ROOM_SYNC_STATE }
  }

  const players = parsed.players && typeof parsed.players === 'object' && !Array.isArray(parsed.players)
    ? parsed.players
    : {}

  const solvedPuzzles = Array.isArray(parsed.solvedPuzzles)
    ? parsed.solvedPuzzles
    : []

  return {
    players,
    solvedPuzzles
  }
}

export function parseRoomSyncState(activePlayers) {
  if (!activePlayers) {
    return { ...DEFAULT_ROOM_SYNC_STATE }
  }

  try {
    const parsed = typeof activePlayers === 'string' ? JSON.parse(activePlayers) : activePlayers

    if (Array.isArray(parsed)) {
      const players = {}
      parsed.forEach((playerId) => {
        players[playerId] = {
          name: `Jugador ${Number(playerId) + 1}`
        }
      })
      return {
        players,
        solvedPuzzles: []
      }
    }

    return sanitizeRoomSyncState(parsed)
  } catch {
    return { ...DEFAULT_ROOM_SYNC_STATE }
  }
}

export function stringifyRoomSyncState(syncState) {
  return JSON.stringify(sanitizeRoomSyncState(syncState))
}

export async function createRoom(room) {
  return request(ROOMS_URL, {
    method: 'POST',
    body: JSON.stringify(buildRoomPayload(room))
  })
}

export async function listRooms(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const url = query.size ? `${ROOMS_URL}?${query.toString()}` : ROOMS_URL
  return request(url)
}

export async function getRoom(id) {
  return request(`${ROOMS_URL}/${id}`)
}

export async function updateRoom(id, room) {
  return request(`${ROOMS_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(buildRoomPayload(room))
  })
}

export async function deleteRoom(id) {
  return request(`${ROOMS_URL}/${id}`, {
    method: 'DELETE'
  })
}

export async function changeRoomPlayerCount(id, delta) {
  const room = await getRoom(id)
  const nextPlayerCount = Math.max(0, (room.playerCount ?? 0) + delta)

  return updateRoom(id, {
    ...room,
    playerCount: nextPlayerCount,
    lastActivity: Date.now()
  })
}

export async function touchRoom(id, overrides = {}) {
  const room = await getRoom(id)
  return updateRoom(id, {
    ...room,
    ...overrides,
    lastActivity: Date.now()
  })
}

export async function updateRoomSyncState(id, updater) {
  const room = await getRoom(id)
  const currentSyncState = parseRoomSyncState(room.activePlayers)
  const nextSyncState = sanitizeRoomSyncState(updater(currentSyncState, room) || currentSyncState)

  return updateRoom(id, {
    ...room,
    activePlayers: stringifyRoomSyncState(nextSyncState),
    lastActivity: Date.now()
  })
}
