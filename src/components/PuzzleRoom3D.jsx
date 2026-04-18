/*
 * ========================================
 * PuzzleRoom3D.jsx - Sala de Puzzles 3D
 * ========================================
 * Componente principal para la experiencia de sala 3D en primera persona.
 * 
 * Características:
 * - Entorno 3D interactivo con Three.js
 * - Movimiento libre con WASD / mouse lock (click)
 * - Estaciones de puzzle interactuables (E)
 * - Avatares de otros jugadores en tiempo real
 * - Sincronización multiplayer vía localStorage
 * - Menú ESC para salir/cerrar sala (creador puede expulsar jugadores)
 * ========================================
 */

import { Suspense, lazy, useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import {
  createScene,
  createFloor,
  createWalls,
  createDecorativeObjects,
  createExitDoor,
  createPuzzleStations,
  createPlayerAvatars,
  updateAvatarPosition,
  updateAvatarLabel,
  updateAvatarRotation
} from '../utils/three-helpers.js'
import { deleteRoom, getRoom, parseRoomSyncState, touchRoom, updateRoom, updateRoomSyncState } from '../services/gameRooms.js'

const NodePuzzle = lazy(() => import('../pages/NodePuzzle/NodePuzzle.jsx'))
const VossQuiz = lazy(() => import('./VossQuiz.jsx'))
const DataReconstructionPuzzle = lazy(() => import('./DataReconstructionPuzzle.jsx'))
const CipherBoardPuzzle = lazy(() => import('./CipherBoardPuzzle.jsx'))

function getRoomPuzzleStateKey(roomName) {
  return `ROOM_PUZZLES:${roomName}`
}

function readSharedSolvedPuzzles(roomName) {
  try {
    const stored = localStorage.getItem(getRoomPuzzleStateKey(roomName))
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeSharedSolvedPuzzles(roomName, solvedPuzzles) {
  localStorage.setItem(getRoomPuzzleStateKey(roomName), JSON.stringify(solvedPuzzles))
}

function mergeSolvedPuzzles(...puzzleSets) {
  return Array.from(new Set(puzzleSets.flat().filter(Boolean)))
}

function syncPlayerPosition(roomName, playerId, camera) {
  try {
    const syncKey = `PLAYERS_SYNC:${roomName}`
    const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')
    const userName = sessionStorage.getItem(`PLAYER_NAME:${roomName}:${playerId}`) || `Jugador ${playerId + 1}`

    playersData[playerId] = {
      name: userName,
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z
      },
      lastSeen: Date.now()
    }

    localStorage.setItem(syncKey, JSON.stringify(playersData))
  } catch {
    // noop
  }
}

function readOtherPlayersPositions(roomName) {
  try {
    const syncKey = `PLAYERS_SYNC:${roomName}`
    return JSON.parse(localStorage.getItem(syncKey) || '{}')
  } catch {
    return {}
  }
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatElapsedTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function PuzzleLoader() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.82)',
      color: '#00d4ff',
      fontSize: 20
    }}>
      Cargando puzzle...
    </div>
  )
}

function PuzzleRoom3D({ roomData, onExit, forcePlayerView, onSessionEnd }) {
  // ============ Datos de Sala ============
  // fallback para cuando no hay datos de sala (modo prueba)
  const effectiveRoomData = roomData || {
    roomName: 'Sala 3D',
    playerCount: 1,
    difficulty: 'normal',
    maxTime: 30,
    playerId: 0
  }

  const myPlayerId = effectiveRoomData.playerId !== undefined ? effectiveRoomData.playerId : 0

  // ============ Estado del Componente ============
  // Referencias para el renderizado 3D
  const containerRef = useRef(null)
  const controlsRef = useRef(null)
  const onExitRef = useRef(onExit)
  const onSessionEndRef = useRef(onSessionEnd)
  const sessionPersistedRef = useRef(false)
  const closingPuzzleRef = useRef(false) // flag para no abrir menú al cerrar puzzle

  // Estado de juego
  const [activePuzzle, setActivePuzzle] = useState(null)    // puzzle actualmente abierto
  const [completedPuzzles, setCompletedPuzzles] = useState([])  // progreso compartido de sala
  const [canInteract, setCanInteract] = useState(false)    // si hay objeto interactuable cerca
  const [currentPlayer, setCurrentPlayer] = useState(0)    // jugador mostrado en tabla
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0)
  const completedPuzzlesRef = useRef([])
  const hasTimedOutRef = useRef(false)
  const activePuzzleStartedAtRef = useRef(null)
  const [sessionStats, setSessionStats] = useState({
    successes: 0,
    failures: 0,
    solvedPuzzleIds: [],
    totalSolveSeconds: 0
  })
  const sessionStatsRef = useRef({
    successes: 0,
    failures: 0,
    solvedPuzzleIds: [],
    totalSolveSeconds: 0
  })

  // Estado del menú ESC
  const [menuOpen, setMenuOpen] = useState(false)
  const menuOpenRef = useRef(false) // ref para evitar closure stale en handlers
  const [roomPlayerCount, setRoomPlayerCount] = useState(effectiveRoomData.playerCount || 1)

  // Permisos y variables calculadas
  const isCreator = myPlayerId === 0  // solamente el creador (ID 0) puede cerrar sala y expulsar
  
  // ============ Datos del Juego ============
  // Estado para rastrear jugadores presentes en tiempo real
  const [activePlayers, setActivePlayers] = useState([])  // Array de IDs de jugadores presentes
  
  // Refs para optimización y detección de expulsión
  const isKickedRef = useRef(false)  // Flag si el jugador fue expulsado
  const lastSyncTimeRef = useRef(0)  // Para throttle de sincronización
  const playersDataCacheRef = useRef({})  // Cache para evitar actualizaciones innecesarias
  const enterTimeRef = useRef(Date.now())  // Timestamp cuando el jugador entra (grace period para sync)
  const playersDataFromStorageRef = useRef({})  // Cache del backend para animate loop
  const playerNamesRef = useRef({})  // Cache de nombres para evitar re-renders innecesarios en animate
  
  // Inicializar tabla de progreso de cada jugador basado en quiénes están presentes
  const [playerProgress, setPlayerProgress] = useState(() => {
    const players = []
    const playersData = parseRoomSyncState(effectiveRoomData.activePlayers).players || {}
    
    Object.keys(playersData).forEach(playerIdStr => {
      const playerId = parseInt(playerIdStr)
      if (playersData[playerId]) {
        const userName = playersData[playerId]?.name || `Jugador ${playerId + 1}`
        players.push({
          id: playerId,
          name: userName,
          completedPuzzles: [],
          score: 0
        })
      }
    })
    
    return players.sort((a, b) => a.id - b.id)
  })

  // Contar jugadores presentes en tiempo real
  const safePlayerCount = activePlayers.length || 1
  const currentPlayerCount = roomPlayerCount
  const roomStartTimestamp = useMemo(() => {
    const createdAt = effectiveRoomData.createdAt ? new Date(effectiveRoomData.createdAt).getTime() : Date.now()
    return Number.isNaN(createdAt) ? Date.now() : createdAt
  }, [effectiveRoomData.createdAt])
  const roomTimeLimitSeconds = (effectiveRoomData.maxTime || 30) * 60
  const sessionElapsedSeconds = Math.floor((Date.now() - enterTimeRef.current) / 1000)
  const resolvedPuzzleCount = sessionStats.solvedPuzzleIds.length
  const averageSolveSeconds = resolvedPuzzleCount > 0
    ? Math.round(sessionStats.totalSolveSeconds / resolvedPuzzleCount)
    : 0

  // Sincronizar menuOpenRef con estado de React
  useEffect(() => {
    menuOpenRef.current = menuOpen
  }, [menuOpen])

  useEffect(() => {
    onExitRef.current = onExit
  }, [onExit])

  useEffect(() => {
    onSessionEndRef.current = onSessionEnd
  }, [onSessionEnd])

  useEffect(() => {
    completedPuzzlesRef.current = completedPuzzles
  }, [completedPuzzles])

  useEffect(() => {
    sessionStatsRef.current = sessionStats
  }, [sessionStats])

  const persistSessionStats = async () => {
    if (sessionPersistedRef.current) {
      return
    }

    sessionPersistedRef.current = true

    if (typeof onSessionEndRef.current !== 'function') {
      return
    }

    const latestStats = sessionStatsRef.current

    try {
      await onSessionEndRef.current({
        sessionElapsedSeconds: Math.floor((Date.now() - enterTimeRef.current) / 1000),
        totalSolveSeconds: latestStats.totalSolveSeconds || 0,
        successes: latestStats.successes || 0,
        failures: latestStats.failures || 0,
        puzzlesSolved: latestStats.solvedPuzzleIds?.length || 0
      })
    } catch (error) {
      console.error('Error persistiendo estadisticas de la sesion:', error)
    }
  }

  useEffect(() => {
    hasTimedOutRef.current = false

    const updateRoomTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - roomStartTimestamp) / 1000)
      const nextRemaining = Math.max(0, roomTimeLimitSeconds - elapsedSeconds)
      setTimeRemainingSeconds(nextRemaining)

      if (nextRemaining <= 0) {
        hasTimedOutRef.current = true
      }
    }

    updateRoomTimer()
    const interval = setInterval(updateRoomTimer, 1000)

    return () => clearInterval(interval)
  }, [roomStartTimestamp, roomTimeLimitSeconds])

  useEffect(() => {
    const syncKey = `PLAYERS_SYNC:${effectiveRoomData.roomName}`

    const pullSyncStateFromBackend = async () => {
      if (!effectiveRoomData.id) {
        return
      }

      try {
        const latestRoom = await getRoom(effectiveRoomData.id)
        const syncState = parseRoomSyncState(latestRoom.activePlayers)
        localStorage.setItem(syncKey, JSON.stringify(syncState.players || {}))
        const remoteSolvedPuzzles = mergeSolvedPuzzles(syncState.solvedPuzzles || [])
        writeSharedSolvedPuzzles(effectiveRoomData.roomName, remoteSolvedPuzzles)
        setCompletedPuzzles(remoteSolvedPuzzles)
      } catch (error) {
        console.error('Error sincronizando estado remoto de la sala:', error)
      }
    }

    pullSyncStateFromBackend()
    const interval = setInterval(pullSyncStateFromBackend, 700)

    return () => clearInterval(interval)
  }, [effectiveRoomData.id, effectiveRoomData.roomName])

  useEffect(() => {
    const pushLocalStateToBackend = async () => {
      if (!effectiveRoomData.id || isKickedRef.current) {
        return
      }

      try {
        const syncKey = `PLAYERS_SYNC:${effectiveRoomData.roomName}`
        const localPlayers = JSON.parse(localStorage.getItem(syncKey) || '{}')
        const localPlayerState = localPlayers[myPlayerId]
        const solvedPuzzles = completedPuzzlesRef.current

        if (!localPlayerState) {
          return
        }

        await updateRoomSyncState(effectiveRoomData.id, (syncState) => ({
          ...syncState,
          players: {
            ...syncState.players,
            [myPlayerId]: {
              ...syncState.players?.[myPlayerId],
              ...localPlayerState,
              lastSeen: Date.now()
            }
          },
          solvedPuzzles: mergeSolvedPuzzles(syncState.solvedPuzzles || [], solvedPuzzles)
        }))
      } catch (error) {
        console.error('Error empujando estado local al backend:', error)
      }
    }

    const interval = setInterval(pushLocalStateToBackend, 600)
    return () => clearInterval(interval)
  }, [effectiveRoomData.id, effectiveRoomData.roomName, myPlayerId])

  // Monitorear cambios en PLAYERS_SYNC con Storage Event Listener
  // Esto es MÁS RÁPIDO que polling porque detects cambios en tiempo real (ms, no 500ms)
  useEffect(() => {
    const syncKey = `PLAYERS_SYNC:${effectiveRoomData.roomName}`
    
    const updatePlayersFromSync = () => {
      try {
        const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')
        const presentPlayerIds = Object.keys(playersData).map(id => parseInt(id)).sort((a, b) => a - b)
        const dataStr = JSON.stringify(presentPlayerIds)
        
        // Cachear los datos completos para usarlos en el animate loop (REDUCE PARSING)
        playersDataFromStorageRef.current = playersData
        
        // También cachear los nombres para evitar re-renders innecesarios
        Object.keys(playersData).forEach(playerIdStr => {
          const playerId = parseInt(playerIdStr)
          const playerName = playersData[playerId]?.name || `Jugador ${playerId + 1}`
          playerNamesRef.current[playerId] = playerName
        })
        
        // Solo actualizar si realmente cambió
        if (dataStr === JSON.stringify(playersDataCacheRef.current)) return
        playersDataCacheRef.current = presentPlayerIds
        
        setActivePlayers(presentPlayerIds)
        
        // **Grace period**: No aplicar lógica de expulsión durante los primeros 2 segundos
        // Esto permite que la primera sincronización de posición se complete sin falsos positivos
        const timeSinceEnter = Date.now() - enterTimeRef.current
        
        // Detectar si FUI EXPULSADO (no estoy en la lista)
        // Solo después de 2 segundos para evitar race conditions al entrar
        if (timeSinceEnter > 2000 && !presentPlayerIds.includes(myPlayerId) && !isKickedRef.current) {
          isKickedRef.current = true
          console.log(`¡Jugador ${myPlayerId} fue expulsado!`)
          // Seremos desconectados por el effect de checkPlayerStatus
          return
        }
        
        // Actualizar playerProgress si cambió
        setPlayerProgress(prev => {
          const newPlayers = presentPlayerIds.map(playerId => {
            const existing = prev.find(p => p.id === playerId)
            if (existing) return existing
            
            const userName = sessionStorage.getItem(`PLAYER_NAME:${effectiveRoomData.roomName}:${playerId}`) || `Jugador ${playerId + 1}`
            return {
              id: playerId,
              name: userName,
              completedPuzzles: [],
              score: 0
            }
          })
          
          return newPlayers
        })
      } catch (error) {
        console.error('Error verificando jugadores activos:', error)
      }
    }

    // Escuchar cambios de storage en tiempo real
    const handleStorageChange = (e) => {
      if (e.key === syncKey) {
        updatePlayersFromSync()
      }
    }

    // Verificación inmediata
    updatePlayersFromSync()

    const pollInterval = setInterval(updatePlayersFromSync, 80)

    // Escuchar cambios de storage en tiempo real
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [effectiveRoomData.roomName, myPlayerId])

  /**
   * Actualiza el contador de jugadores en localStorage
   * @param {number} delta - cantidad a sumar/restar (-1 para salir, +1 para entrar)
   */
  const syncRoomPlayerCount = async (delta) => {
    if (!effectiveRoomData.id) {
      return null
    }

    try {
      const room = await getRoom(effectiveRoomData.id)
      const updatedRoom = await updateRoom(effectiveRoomData.id, {
        ...room,
        playerCount: Math.max(0, (room.playerCount ?? 0) + delta),
        lastActivity: Date.now()
      })
      setRoomPlayerCount(updatedRoom.playerCount ?? 0)
      return updatedRoom
    } catch (error) {
      console.error('Error actualizando contador de sala:', error)
      return null
    }
  }

  /**
   * Expulsa a un jugador de la sala
   * SOLO el creador puede hacer esto
   * @param {number} playerId - ID del jugador a expulsar
   */
  const kickPlayer = async (playerId) => {
    if (playerId === myPlayerId) return  // no puede expulsarse a sí mismo

    try {
      // Eliminar datos de sincronización
      const syncKey = `PLAYERS_SYNC:${effectiveRoomData.roomName}`
      const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')
      if (playersData[playerId] !== undefined) {
        delete playersData[playerId]
        localStorage.setItem(syncKey, JSON.stringify(playersData))
      }

      if (effectiveRoomData.id) {
        await updateRoomSyncState(effectiveRoomData.id, (syncState) => {
          const nextPlayers = { ...syncState.players }
          delete nextPlayers[playerId]

          return {
            ...syncState,
            players: nextPlayers
          }
        })
      }

      // Limpiar sesión del jugador expulsado
      sessionStorage.removeItem(`PLAYER_NAME:${effectiveRoomData.roomName}:${playerId}`)
      sessionStorage.removeItem(`PLAYER_ID:${effectiveRoomData.roomName}:${playerId}`)

      // Actualizar tabla de progreso local
      setPlayerProgress(prev => prev.filter(player => player.id !== playerId))

      // Decrementar contador de sala
      await syncRoomPlayerCount(-1)
    } catch (error) {
      console.error('Error expulsando jugador:', error)
    }
  }

  /**
   * Cierra la sala completamente
   * SOLO el creador puede hacerlo - todos son desconectados
   */
  const closeRoom = async () => {
    if (!isCreator) {
      return
    }
    // Limpiar todos los datos de sincronización Y sesión
    try {
      // Limpiar sincronización de TODOS los jugadores
      const syncKey = `PLAYERS_SYNC:${effectiveRoomData.roomName}`
      localStorage.removeItem(syncKey)

      // Limpiar todos los datos de sesión de la sala
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(`PLAYER_NAME:${effectiveRoomData.roomName}:`) ||
            key.startsWith(`PLAYER_ID:${effectiveRoomData.roomName}:`) ||
            key === `PLAYER_ID:${effectiveRoomData.roomName}`) {
          sessionStorage.removeItem(key)
        }
      })

      if (effectiveRoomData.id) {
        await deleteRoom(effectiveRoomData.id)
      }

      localStorage.removeItem(getRoomPuzzleStateKey(effectiveRoomData.roomName))

      console.log(`Sala ${effectiveRoomData.roomName} cerrada completamente`)
    } catch (error) {
      console.error('Error cerrando sala:', error)
    }

    setMenuOpen(false)
    // Llamar onExit para regresar a pantalla principal
    await persistSessionStats()
    onExit()
  }

  /**
   * Un jugador regular sale de la sala
   */
  const leaveRoom = async () => {
    try {
      // Decrementar contador de sala en tiempo real
      const updatedRoom = await syncRoomPlayerCount(-1)

      // Limpiar mi data de sincronización
      const syncKey = `PLAYERS_SYNC:${effectiveRoomData.roomName}`
      const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')
      if (playersData[myPlayerId] !== undefined) {
        delete playersData[myPlayerId]
        localStorage.setItem(syncKey, JSON.stringify(playersData))
      }

      if (effectiveRoomData.id) {
        await updateRoomSyncState(effectiveRoomData.id, (syncState) => {
          const nextPlayers = { ...syncState.players }
          delete nextPlayers[myPlayerId]

          return {
            ...syncState,
            players: nextPlayers
          }
        })
      }

      // Limpiar mi sesión
      sessionStorage.removeItem(`PLAYER_NAME:${effectiveRoomData.roomName}:${myPlayerId}`)
      sessionStorage.removeItem(`PLAYER_ID:${effectiveRoomData.roomName}:${myPlayerId}`)

      if ((updatedRoom?.playerCount ?? 0) <= 0) {
        localStorage.removeItem(syncKey)
        localStorage.removeItem(getRoomPuzzleStateKey(effectiveRoomData.roomName))
        if (effectiveRoomData.id) {
          await deleteRoom(effectiveRoomData.id)
        }
      }

      console.log(`Jugador ${myPlayerId} salió de la sala`)
    } catch (error) {
      console.error('Error saliendo de la sala:', error)
    }

    setMenuOpen(false)
    // Llamar onExit para regresar a pantalla principal
    await persistSessionStats()
    onExit()
  }

  useEffect(() => {
    if (timeRemainingSeconds > 0 || hasTimedOutRef.current === false) {
      return
    }

    const closeRoomByTimeout = async () => {
      try {
        const syncKey = `PLAYERS_SYNC:${effectiveRoomData.roomName}`
        localStorage.removeItem(syncKey)
        localStorage.removeItem(getRoomPuzzleStateKey(effectiveRoomData.roomName))

        if (effectiveRoomData.id) {
          await deleteRoom(effectiveRoomData.id)
        }
      } catch (error) {
        console.error('Error cerrando sala por tiempo agotado:', error)
      } finally {
        await persistSessionStats()
        onExitRef.current()
      }
    }

    closeRoomByTimeout()
  }, [effectiveRoomData.id, effectiveRoomData.roomName, timeRemainingSeconds])

  // Referencias para raycasting e interacción
  const interactableRef = useRef(null)
  const canInteractRef = useRef(false)

  // Estaciones de puzzle memoizadas (evita re-renders innecesarios)
  const puzzleStations = useMemo(() => [
    { id: 'nodePuzzle', name: 'Puzzle de Nodos', position: { x: -8, y: 1, z: -5 } },
    { id: 'vossQuiz', name: 'Terminal VOSS', position: { x: 8, y: 1, z: -5 } },
    { id: 'dataReconstruction', name: 'Archivo Corrupto', position: { x: 0, y: 1, z: -10 } },
    { id: 'cipherBoard', name: 'Pizarra de Simbolos', position: { x: 12, y: 1, z: -12 } }
  ], [])

  // ============ Configuración de Estilos UI ============
  // Estilos reutilizables para paneles del HUD
  const huiPanelStyle = {
    position: 'absolute',
    color: '#00d4ff',
    fontSize: 14,
    zIndex: 10,
    background: 'rgba(0, 0, 0, 0.7)',
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid #0f3460',
    fontFamily: 'Arial, sans-serif'
  }

  const menuModalStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 999,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const menuBoxStyle = {
    width: '320px',
    padding: '20px',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.95)',
    color: '#fff',
    border: '1px solid #00d4ff',
    boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)'
  }

  const hudCardStyle = {
    ...huiPanelStyle,
    border: '1px solid rgba(0, 212, 255, 0.35)',
    background: 'linear-gradient(180deg, rgba(3, 10, 18, 0.88) 0%, rgba(5, 18, 31, 0.72) 100%)',
    backdropFilter: 'blur(10px)'
  }
  // ============ Inicialización de Escena 3D ============
  // El useEffect crea y mantiene la escena 3D, incluyendo:
  // - Cámara, renderer, geometría de sala
  // - Avatares de jugadores
  // - Sistema de input (teclado, pointer lock)
  // - Loop de animación
  // - Sincronización multiplayer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // --- Crear escena y elementos base ---
    const { scene, camera, renderer } = createScene(container)
    createFloor(scene)
    createWalls(scene)
    createDecorativeObjects(scene, 8)
    
    // Crear estaciones interactuables y puerta de salida
    const stations = createPuzzleStations(scene, puzzleStations)
    const exitDoor = createExitDoor(scene)
    
    // Crear avatares 3D solo para jugadores realmente presentes
    // Usar playerProgress que ya tiene jugadores actuales basado en PLAYERS_SYNC
    // Create all possible avatar slots once so joining players do not recreate the whole scene.
    const actualPlayerCount = effectiveRoomData.maxPlayers || 1
    const playerNames = Array.from({ length: actualPlayerCount }, (_, index) => {
      const player = playerProgress.find((entry) => entry.id === index)
      return player?.name || `Jugador ${index + 1}`
    })
    const playerAvatarMeshes = createPlayerAvatars(scene, actualPlayerCount, playerNames)

    if (playerAvatarMeshes[myPlayerId]) {
      playerAvatarMeshes[myPlayerId].visible = false
    }
    if (playerAvatarMeshes[`label_${myPlayerId}`]) {
      playerAvatarMeshes[`label_${myPlayerId}`].visible = false
    }

    // Cargar posiciones iniciales de otros jugadores desde localStorage
    const initialPlayersData = readOtherPlayersPositions(effectiveRoomData.roomName)
    Object.keys(initialPlayersData).forEach(playerIndexStr => {
      const playerIndex = parseInt(playerIndexStr)
      if (playerAvatarMeshes[playerIndex] && initialPlayersData[playerIndex].position) {
        updateAvatarPosition(playerAvatarMeshes[playerIndex], initialPlayersData[playerIndex].position)
      }
      if (playerAvatarMeshes[`label_${playerIndex}`] && initialPlayersData[playerIndex].name) {
        updateAvatarLabel(playerAvatarMeshes[`label_${playerIndex}`], initialPlayersData[playerIndex].name)
      }
    })

    // --- Configurar controles de primera persona ---
    const controls = new PointerLockControls(camera, renderer.domElement)
    controlsRef.current = controls

    // Click en canvas para activar pointer lock
    const lockOnClick = () => controls.lock()
    renderer.domElement.addEventListener('click', lockOnClick)

    // --- Sistema de Input (Teclado) ---
    const velocity = new THREE.Vector3()
    const direction = new THREE.Vector3()
    const move = { forward: false, backward: false, left: false, right: false }

    // Manejo de teclas presionadas
    const handleKeyDown = (event) => {
      const isMenuOpen = menuOpenRef.current

      // ESC: alterna entre menú y juego
      if (event.code === 'Escape') {
        event.preventDefault()
        if (isMenuOpen) {
          setMenuOpen(false)
          if (controls.isLocked) controls.lock()
        } else {
          setMenuOpen(true)
          controls.unlock()
        }
        return
      }

      // Si menú abierto, no procesar teclas de movimiento
      if (isMenuOpen) {
        return
      }

      // Mapear teclas WASD a direcciones
      const keyMap = {
        'KeyW': 'forward',
        'KeyS': 'backward',
        'KeyA': 'left',
        'KeyD': 'right'
      }
      
      if (keyMap[event.code]) {
        move[keyMap[event.code]] = true
      }
      
      // E: interactuar con objetos cercanos
      if (event.code === 'KeyE') {
        if (canInteractRef.current && interactableRef.current) {
          if (interactableRef.current.userData.isExit) {
            if (completedPuzzlesRef.current.length >= puzzleStations.length) {
              leaveRoom()
            }
          } else {
            setActivePuzzle(interactableRef.current.userData.puzzleId)
            controls.unlock()
          }
        }
      }
    }

    // Manejo de teclas soltadas
    const handleKeyUp = (event) => {
      const isMenuOpen = menuOpenRef.current
      if (isMenuOpen) {
        return
      }

      const keyMap = {
        'KeyW': 'forward',
        'KeyS': 'backward',
        'KeyA': 'left',
        'KeyD': 'right'
      }
      
      if (keyMap[event.code]) {
        move[keyMap[event.code]] = false
      }
    }

    // Registrar listeners de input
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    // Detectar cuando el pointer lock se libera (incluye ESC del navegador)
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === renderer.domElement
      // Solo abrir menú si pointer se libera Y no estamos cerrando un puzzle
      if (!isLocked && !closingPuzzleRef.current) {
        setMenuOpen(true)
      }
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)

    // --- Sistema de Raycasting (Detección de Objetos Cercanos) ---
    const raycaster = new THREE.Raycaster()
    let currentIntersected = null

    const updateRaycast = () => {
      // Raycast desde el centro de la pantalla
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
      const interactables = [...stations, exitDoor]
      const intersects = raycaster.intersectObjects(interactables, false)

      if (intersects.length > 0 && intersects[0].distance < 8) {
        const hit = intersects[0].object
        if (hit.userData.isExit && completedPuzzlesRef.current.length < puzzleStations.length) {
          if (currentIntersected) {
            currentIntersected.material.emissive.setHex(
              currentIntersected.userData.completed ? 0x2ed573 : 0x00d4ff
            )
            currentIntersected.material.emissiveIntensity = 0.3
          }
          currentIntersected = null
          interactableRef.current = null
          setCanInteract(false)
          canInteractRef.current = false
          return
        }
        if (currentIntersected !== hit) {
          // Restaurar color del objeto anterior
          if (currentIntersected) {
            currentIntersected.material.emissive.setHex(
              currentIntersected.userData.completed ? 0x2ed573 : 0x00d4ff
            )
            currentIntersected.material.emissiveIntensity = 0.3
          }
          
          // Resaltar nuevo objeto
          currentIntersected = hit
          currentIntersected.material.emissive.setHex(0xffff00)
          currentIntersected.material.emissiveIntensity = 0.8
          interactableRef.current = hit
        }
        setCanInteract(true)
        canInteractRef.current = true
      } else {
        // Nada cerca
        if (currentIntersected) {
          currentIntersected.material.emissive.setHex(
            currentIntersected.userData.completed ? 0x2ed573 : 0x00d4ff
          )
          currentIntersected.material.emissiveIntensity = 0.3
          currentIntersected = null
          interactableRef.current = null
        }
        setCanInteract(false)
        canInteractRef.current = false
      }
    }

    // --- Loop de Animación ---
    const clock = new THREE.Clock()
    let animationId = null

    const animate = () => {
      const delta = clock.getDelta()

      // Movimiento del jugador (solo si pointer está bloqueado)
      if (controls.isLocked) {
        velocity.x -= velocity.x * 10.0 * delta
        velocity.z -= velocity.z * 10.0 * delta

        direction.z = Number(move.forward) - Number(move.backward)
        direction.x = Number(move.right) - Number(move.left)
        direction.normalize()

        if (move.forward || move.backward) velocity.z -= direction.z * 50.0 * delta
        if (move.left || move.right) velocity.x -= direction.x * 50.0 * delta

        controls.moveRight(-velocity.x * delta)
        controls.moveForward(-velocity.z * delta)
        if (completedPuzzlesRef.current.length < puzzleStations.length) {
          const position = controls.object.position
          if (position.z > 15.5 && Math.abs(position.x) < 2.4) {
            position.z = 15.5
          }
        }
      }

      // **OPTIMIZACIÓN: Sincronizar posición con THROTTLE (cada 100ms en lugar de cada frame)**
      // Esto reduce escrituras a localStorage de ~60/seg a ~10/seg, reduciendo lag masivamente
      // EXCEPTO la primera sincronización que ocurre inmediatamente para establecer presencia
      if (!isKickedRef.current) {
        const now = performance.now()
        const isFirstSync = lastSyncTimeRef.current === 0
        if (isFirstSync || now - lastSyncTimeRef.current > 100) {
          syncPlayerPosition(effectiveRoomData.roomName, myPlayerId, camera)
          lastSyncTimeRef.current = now
        }
      }

      // **OPTIMIZACIÓN MEMORIA**: Usar cache de players data en lugar de parsear localStorage cada frame
      // Esto reduce significativamente el consumo de memoria y CPU
      const playersData = playersDataFromStorageRef.current
      const isExitUnlocked = completedPuzzlesRef.current.length >= puzzleStations.length
      exitDoor.userData.locked = !isExitUnlocked
      exitDoor.material.color.setHex(isExitUnlocked ? 0x2ed573 : 0xff6b6b)
      exitDoor.material.emissive.setHex(isExitUnlocked ? 0x2ed573 : 0xff1744)
      exitDoor.material.emissiveIntensity = isExitUnlocked ? 0.35 : 0.2
      
      Object.keys(playersData).forEach(playerIndexStr => {
        const playerIndex = parseInt(playerIndexStr)
        if (playerAvatarMeshes[playerIndex] && playersData[playerIndex].position) {
          updateAvatarPosition(playerAvatarMeshes[playerIndex], playersData[playerIndex].position)
          updateAvatarRotation(playerAvatarMeshes[playerIndex], playersData[playerIndex].rotation)
        }
        
        // **OPTIMIZACIÓN**: Solo update avatar labels si el nombre cambió (usando cache)
        // Evita re-renders innecesarios de setPlayerProgress cada frame
        if (playerAvatarMeshes[`label_${playerIndex}`] && playersData[playerIndex].name) {
          const cachedName = playerNamesRef.current[playerIndex]
          const newName = playersData[playerIndex].name
          
          // Solo actualizar si realmente cambió
          if (cachedName !== newName) {
            playerNamesRef.current[playerIndex] = newName
            updateAvatarLabel(playerAvatarMeshes[`label_${playerIndex}`], newName)
          }
        }
      })

      // Detectar objetos interactuables cerca del jugador
      updateRaycast()

      // Renderizar frame
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    animate()

    // --- Manejo de Redimensionamiento ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // --- Limpieza de recursos al desmontar ---
    return () => {
      // Remover listeners de eventos
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('click', lockOnClick)

      // Limpiar Three.js
      controls.dispose()
      renderer.dispose()
      if (animationId) cancelAnimationFrame(animationId)
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      // Eliminar mi jugador de sincronización
      try {
        const syncKey = `PLAYERS_SYNC:${effectiveRoomData.roomName}`
        const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')
        if (playersData[myPlayerId] !== undefined) {
          delete playersData[myPlayerId]
          localStorage.setItem(syncKey, JSON.stringify(playersData))
        }
      } catch (error) {
        console.error('Error limpiando datos de sincronización:', error)
      }

      // **Limpiar caches de memoria** para evitar memory leaks
      playersDataFromStorageRef.current = {}
      playerNamesRef.current = {}
    }
    // NOTA: playerProgress no incluido en dependencias para evitar recreación constante de la escena
    // setPlayerProgress se usa solo cuando hay Nuevo jugador, no cada frame
  }, [puzzleStations, effectiveRoomData.roomName, effectiveRoomData.maxPlayers, myPlayerId]) // The scene must stay mounted while players join.

  // Actualizar actividad de la sala cada 30 segundos
  useEffect(() => {
    const updateActivity = async () => {
      if (!effectiveRoomData.id || effectiveRoomData.roomName === 'Sala 3D') {
        return
      }

      try {
        await touchRoom(effectiveRoomData.id)
      } catch (error) {
        console.error('Error actualizando actividad:', error)
      }
    }

    const interval = setInterval(updateActivity, 30000)
    return () => clearInterval(interval)
  }, [effectiveRoomData.id, effectiveRoomData.roomName])

  // Detectar si el jugador fue expulsado o la sala fue cerrada
  useEffect(() => {
    const checkPlayerStatus = async () => {
      try {
        // Si ya sabemos que fuimos expulsados, salir inmediatamente
        if (isKickedRef.current) {
          console.log(`Detección confirma: Jugador ${myPlayerId} fue expulsado`)
          await persistSessionStats()
          onExitRef.current()
          return
        }
        
        // Verificar si la sala aún existe
        if (effectiveRoomData.id) {
          try {
            await getRoom(effectiveRoomData.id)
          } catch (error) {
            if (error.status === 404) {
              console.log(`Sala ${effectiveRoomData.roomName} fue cerrada`)
              await persistSessionStats()
              onExitRef.current()
              return
            }
            throw error
          }
        }

        // Verificar si el jugador fue expulsado (no está en PLAYERS_SYNC)
        const syncKey = `PLAYERS_SYNC:${effectiveRoomData.roomName}`
        const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')
        
        if (!playersData[myPlayerId] && !isKickedRef.current) {
          // El jugador fue expulsado
          isKickedRef.current = true
          console.log(`Jugador ${myPlayerId} fue expulsado de la sala`)
          await persistSessionStats()
          onExitRef.current()
          return
        }
      } catch (error) {
        console.error('Error verificando estado del jugador:', error)
      }
    }

    // Verificar cada 200ms (más rápido que antes para detección más responsiva)
    const interval = setInterval(checkPlayerStatus, 2000)
    return () => clearInterval(interval)
  }, [effectiveRoomData.id, effectiveRoomData.roomName, myPlayerId])

  // ============ Manejadores de Eventos de Puzzles ============

  /**
   * Cierra el puzzle actual y rebloquea el pointer
   */
  const handlePuzzleClose = () => {
    setActivePuzzle(null)
    
    // Flag para evitar que se abra el menú automáticamente
    // Se resetea después de cierto tiempo para permitir que pointerlockchange funcione normalmente
    closingPuzzleRef.current = true
    setTimeout(() => {
      closingPuzzleRef.current = false
    }, 300)
    
    if (controlsRef.current && containerRef.current) {
      setTimeout(() => {
        controlsRef.current.lock()
      }, 150)
    }
  }

  const registerPuzzleSuccess = (amount = 1) => {
    setSessionStats((prev) => ({
      ...prev,
      successes: prev.successes + amount
    }))
  }

  const registerPuzzleFailure = (amount = 1) => {
    setSessionStats((prev) => ({
      ...prev,
      failures: prev.failures + amount
    }))
  }

  /**
   * Marca un puzzle como completado y actualiza puntuación
   */
  const handlePuzzleComplete = (puzzleId) => {
    const solveDurationSeconds = activePuzzleStartedAtRef.current
      ? Math.max(1, Math.round((Date.now() - activePuzzleStartedAtRef.current) / 1000))
      : 0

    setSessionStats((prev) => {
      if (prev.solvedPuzzleIds.includes(puzzleId)) {
        return prev
      }

      return {
        ...prev,
        solvedPuzzleIds: [...prev.solvedPuzzleIds, puzzleId],
        totalSolveSeconds: prev.totalSolveSeconds + solveDurationSeconds
      }
    })

    const playerIdToUpdate = typeof forcePlayerView === 'number' ? forcePlayerView : myPlayerId

    setPlayerProgress(prev => {
      const newProgress = prev.map((player) => {
        if (player.id !== playerIdToUpdate) return player
        const alreadyDone = player.completedPuzzles.includes(puzzleId)
        if (alreadyDone) return player
        return {
          ...player,
          completedPuzzles: [...player.completedPuzzles, puzzleId],
          score: player.score + 100
        }
      })
      return newProgress
    })

    const nextSolvedPuzzles = mergeSolvedPuzzles(completedPuzzlesRef.current, [puzzleId])

    // Puzzle completion is shared per room, not per player.
    writeSharedSolvedPuzzles(effectiveRoomData.roomName, nextSolvedPuzzles)
    setCompletedPuzzles(nextSolvedPuzzles)

    if (effectiveRoomData.id) {
      updateRoomSyncState(effectiveRoomData.id, (syncState) => ({
        ...syncState,
        solvedPuzzles: mergeSolvedPuzzles(syncState.solvedPuzzles || [], nextSolvedPuzzles)
      })).catch((error) => {
        console.error('Error sincronizando puzzle completado con backend:', error)
      })
    }

    // Cambiar a siguiente jugador (modo prueba)
    if (typeof forcePlayerView !== 'number') {
      setCurrentPlayer(prev => (prev + 1) % safePlayerCount)
    }

    setActivePuzzle(null)
    activePuzzleStartedAtRef.current = null
    if (controlsRef.current) {
      setTimeout(() => {
        controlsRef.current.lock()
      }, 100)
    }
  }

  useEffect(() => {
    if (!activePuzzle) {
      activePuzzleStartedAtRef.current = null
      return
    }

    activePuzzleStartedAtRef.current = Date.now()
  }, [activePuzzle])
  // ============ Renderizado ============
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      
      {/* ===== MENÚ ESC ===== */}
      {menuOpen && (
        <div style={menuModalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={menuBoxStyle}>
            <h2 style={{ marginTop: 0, marginBottom: '12px', textAlign: 'center' }}>
              Menú de Sala
            </h2>
            
            {/* Información de la sala */}
            <div style={{ display: 'none', fontSize: '12px', marginBottom: '12px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{effectiveRoomData.roomName}</div>
              <div>👥 Jugadores: {activePlayers.length}</div>
              <div>⚡ Dificultad: {effectiveRoomData.difficulty.charAt(0).toUpperCase() + effectiveRoomData.difficulty.slice(1)}</div>
              <div>⏱️ Tiempo: {effectiveRoomData.maxTime} min</div>
              <div>🎮 Tú: {effectiveRoomData.userName || `Jugador ${myPlayerId + 1}`}</div>
              <div>Salida: {completedPuzzles.length >= puzzleStations.length ? 'Desbloqueada' : 'Bloqueada'}</div>
            </div>
            
            {/* Botón: Continuar jugando */}
            <div style={{ display: 'none', fontSize: '12px', marginBottom: '12px', padding: '10px', background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.35)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00d4ff' }}>
                Tus estadisticas
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                <div>Tiempo en sesion: {formatElapsedTime(sessionElapsedSeconds)}</div>
                <div>Tiempo promedio por puzzle: {resolvedPuzzleCount > 0 ? formatElapsedTime(averageSolveSeconds) : '--:--'}</div>
                <div>Aciertos: {sessionStats.successes}</div>
                <div>Fallos: {sessionStats.failures}</div>
                <div>Puzzles resueltos: {resolvedPuzzleCount}</div>
              </div>
            </div>

            <button
              onClick={() => {
                setMenuOpen(false)
                if (controlsRef.current) controlsRef.current.lock()
              }}
              style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px' }}
            >
              Continuar
            </button>
            
            {/* Botón: Salir de la sala (todos los jugadores) */}
            <button
              onClick={leaveRoom}
              style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', background: '#ff6b6b', color: '#fff' }}
            >
              Salir de la sala
            </button>
            
            {/* Opciones del creador (solo visible si myPlayerId === 0) */}
            {isCreator && (
              <>
                {/* Mostrar código de la sala si es privada */}
                {effectiveRoomData.isPrivate && effectiveRoomData.accessCode && (
                  <div style={{
                    marginBottom: '12px',
                    padding: '10px',
                    background: 'rgba(255, 107, 53, 0.2)',
                    border: '2px solid #ff6b35',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                      🔐 Código de Acceso:
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#ff6b35',
                      letterSpacing: '4px',
                      fontFamily: 'monospace'
                    }}>
                      {effectiveRoomData.accessCode}
                    </div>
                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                      Comparte este código con otros jugadores
                    </div>
                  </div>
                )}
                
                {/* Botón: Cerrar sala (solo creador) */}
                <button
                  onClick={closeRoom}
                  style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', background: '#e84118', color: '#fff' }}
                >
                  Forzar cierre de sala
                </button>
                
                {/* Sección: Expulsar jugadores (solo creador) */}
                <div style={{ fontSize: '12px', marginBottom: '8px', color: '#ccc' }}>
                  Expulsar jugador
                </div>
                {playerProgress
                  .filter(player => player.id !== myPlayerId)
                  .map(player => (
                    <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px' }}>
                        {player.name || `Jugador ${player.id + 1}`}
                      </span>
                      <button
                        onClick={() => kickPlayer(player.id)}
                        style={{ padding: '4px 8px', borderRadius: '4px', background: '#ff3f34', color: '#fff', fontSize: '12px' }}
                      >
                        Expulsar
                      </button>
                    </div>
                  ))}
              </>
            )}
            
            {/* Ayuda */}
            <p style={{ marginTop: '12px', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
              Esc para abrir/cerrar este menú
            </p>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          style={{
            ...hudCardStyle,
            top: 20,
            left: 20,
            width: '220px',
            fontSize: 11
          }}
        >
          <div style={{ fontSize: 9, color: '#7dd3fc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sesion
          </div>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            {effectiveRoomData.roomName}
          </div>
          <div>Dificultad: {effectiveRoomData.difficulty.charAt(0).toUpperCase() + effectiveRoomData.difficulty.slice(1)}</div>
          <div>Jugadores activos: {activePlayers.length}</div>
          <div>Tu usuario: {effectiveRoomData.userName || `Jugador ${myPlayerId + 1}`}</div>
          <div>Progreso global: {completedPuzzles.length} / {puzzleStations.length}</div>
          <div>Puerta: {completedPuzzles.length >= puzzleStations.length ? 'Desbloqueada' : 'Bloqueada'}</div>
        </div>
      )}

      {/* ===== HUD: Tabla de Jugadores (Top-Right) ===== */}
      <div
        style={{
          ...hudCardStyle,
          top: 20,
          right: 20,
          left: 'auto',
          width: '220px',
          fontSize: '12px'
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
          🏆 Jugadores
        </div>
        {playerProgress.map((player) => (
          <div
            key={player.id}
            style={{
              marginBottom: 4,
              padding: '4px',
              borderRadius: '4px',
              background: player.id === myPlayerId ? 'rgba(255, 255, 0, 0.2)' : 'rgba(0, 212, 255, 0.1)',
              border: player.id === myPlayerId ? '1px solid #ffff00' : '1px solid #00d4ff'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '11px', color: player.id === myPlayerId ? '#ffff00' : '#00d4ff' }}>
              {player.name} {player.id === myPlayerId ? '🎯' : ''}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          ...hudCardStyle,
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          minWidth: '170px',
          padding: '12px 16px'
        }}
      >
        <div style={{ fontSize: 9, color: '#aaa', marginBottom: 4 }}>Tiempo de sala</div>
        <div style={{ fontSize: 22, fontWeight: 'bold', color: timeRemainingSeconds <= 60 ? '#ff6b6b' : '#00d4ff' }}>
          {formatCountdown(timeRemainingSeconds)}
        </div>
      </div>

      {/* ===== Crosshair (Centro de pantalla) ===== */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 12,
          height: 12,
          marginLeft: -6,
          marginTop: -6,
          borderRadius: 2,
          background: canInteract ? '#ffff00' : '#ffffff',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: canInteract ? '0 0 10px #ffff00' : 'none',
          transition: 'all 0.2s ease'
        }}
      />

      {/* ===== Indicador de Interacción ===== */}
      {canInteract && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '55%',
            transform: 'translateX(-50%)',
            color: '#ffff00',
            fontSize: 14,
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 10,
            animation: 'pulse 1s infinite'
          }}
        >
          [E] Interactuar
        </div>
      )}

      {/* ===== HUD: Controles (Bottom-Left) ===== */}
      <div
        style={{
          ...huiPanelStyle,
          top: 'auto',
          bottom: 20,
          left: 20,
          fontSize: 10,
          padding: '6px'
        }}
      >
        <div style={{ fontSize: 9, color: '#aaa', marginBottom: 2 }}>Controles:</div>
        <div>Click: Bloquear ratón</div>
        <div>WASD: Mover</div>
        <div>E: Interactuar</div>
        <div>ESC: Menú</div>
      </div>

      {/* ===== Animación CSS ===== */}
      {menuOpen && (
        <div
          style={{
            ...hudCardStyle,
            top: 'auto',
            bottom: 20,
            right: 20,
            left: 'auto',
            width: '220px',
            fontSize: 11
          }}
        >
          <div style={{ fontSize: 9, color: '#7dd3fc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Tu rendimiento
          </div>
          <div>Tiempo en sesion: {formatElapsedTime(sessionElapsedSeconds)}</div>
          <div>Promedio por puzzle: {resolvedPuzzleCount > 0 ? formatElapsedTime(averageSolveSeconds) : '--:--'}</div>
          <div>Aciertos: {sessionStats.successes}</div>
          <div>Fallos: {sessionStats.failures}</div>
          <div>Puzzles resueltos: {resolvedPuzzleCount}</div>
        </div>
      )}

      <div
        style={{
          ...hudCardStyle,
          top: 170,
          left: 20,
          width: '220px',
          fontSize: 11
        }}
      >
        <div style={{ fontSize: 9, color: '#aaa', marginBottom: 8 }}>Puzzles</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button
            type="button"
            onClick={() => setActivePuzzle('nodePuzzle')}
            style={{ padding: '8px', borderRadius: '6px' }}
          >
            Puzzle de Nodos
          </button>
          <button
            type="button"
            onClick={() => setActivePuzzle('vossQuiz')}
            style={{ padding: '8px', borderRadius: '6px' }}
          >
            Terminal VOSS
          </button>
          <button
            type="button"
            onClick={() => setActivePuzzle('dataReconstruction')}
            style={{ padding: '8px', borderRadius: '6px' }}
          >
            Archivo Corrupto
          </button>
          <button
            type="button"
            onClick={() => setActivePuzzle('cipherBoard')}
            style={{ padding: '8px', borderRadius: '6px' }}
          >
            Pizarra de Simbolos
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* ===== Canvas 3D ===== */}
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
      />

      {/* ===== Puzzle Modal (NodePuzzle) ===== */}
      {activePuzzle === 'nodePuzzle' && (
        <Suspense fallback={<PuzzleLoader />}>
          <NodePuzzle
            onClose={handlePuzzleClose}
            roomDifficulty={effectiveRoomData.difficulty}
            onComplete={() => handlePuzzleComplete('nodePuzzle')}
            onSolved={() => handlePuzzleComplete('nodePuzzle')}
            onSuccess={() => registerPuzzleSuccess(1)}
            onFail={() => registerPuzzleFailure(1)}
            currentPlayer={myPlayerId + 1}
          />
        </Suspense>
      )}

      {activePuzzle === 'vossQuiz' && (
        <Suspense fallback={<PuzzleLoader />}>
          <VossQuiz
            onClose={handlePuzzleClose}
            onComplete={() => handlePuzzleComplete('vossQuiz')}
            onSuccess={() => registerPuzzleSuccess(1)}
            onFail={() => registerPuzzleFailure(1)}
          />
        </Suspense>
      )}

      {activePuzzle === 'dataReconstruction' && (
        <Suspense fallback={<PuzzleLoader />}>
          <DataReconstructionPuzzle
            onClose={handlePuzzleClose}
            onComplete={() => handlePuzzleComplete('dataReconstruction')}
            onSuccess={() => registerPuzzleSuccess(1)}
            onFail={() => registerPuzzleFailure(1)}
          />
        </Suspense>
      )}

      {activePuzzle === 'cipherBoard' && (
        <Suspense fallback={<PuzzleLoader />}>
          <CipherBoardPuzzle
            onClose={handlePuzzleClose}
            onComplete={() => handlePuzzleComplete('cipherBoard')}
            onSuccess={() => registerPuzzleSuccess(1)}
            onFail={() => registerPuzzleFailure(1)}
          />
        </Suspense>
      )}
    </div>
  )
}

export default PuzzleRoom3D
