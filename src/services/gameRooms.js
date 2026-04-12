const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const ROOMS_URL = `${API_BASE_URL}/rooms`

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
