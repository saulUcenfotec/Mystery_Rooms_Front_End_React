import { Suspense, lazy, useEffect, useState } from 'react'
import './App.css'
import AuthScreen from './components/AuthScreen.jsx'
import GameSelector from './components/GameSelector.jsx'
import RoomCreator from './components/RoomCreator.jsx'
import RoomLobby from './components/RoomLobby.jsx'
import UserNamePrompt from './components/UserNamePrompt.jsx'
import { clearAuthSession, loadAuthSession, saveAuthSession } from './services/auth.js'
import { createRoom, getRoom, stringifyRoomSyncState, updateRoomSyncState } from './services/gameRooms.js'
import { getUserStats, saveUserSessionStats } from './services/userStats.js'

const PuzzleRoom3D = lazy(() => import('./components/PuzzleRoom3D.jsx'))
const MultiPlayerTest = lazy(() => import('./components/MultiPlayerTest.jsx'))

function ScreenLoader() {
  return (
    <div style={{ color: 'white', fontSize: 18 }}>
      Cargando escena...
    </div>
  )
}

function App() {
  const [selectedGame, setSelectedGame] = useState(null)
  const [puzzleRoom, setPuzzleRoom] = useState(null)
  const [multiPlayerTest, setMultiPlayerTest] = useState(null)
  const [showUserNamePrompt, setShowUserNamePrompt] = useState(false)
  const [pendingRoomData, setPendingRoomData] = useState(null)
  const [authSession, setAuthSession] = useState(() => loadAuthSession())
  const [userStats, setUserStats] = useState(null)

  const currentUser = authSession?.user || null

  const clearPlayerSyncData = async (roomId, playerId) => {
    if (!roomId && roomId !== 0) {
      return
    }

    try {
      await updateRoomSyncState(roomId, (syncState) => {
        const nextPlayers = { ...syncState.players }
        delete nextPlayers[playerId]

        return {
          ...syncState,
          players: nextPlayers
        }
      })
    } catch (error) {
      console.error('Error limpiando datos de sincronizacion:', error)
    }
  }

  const getNextAvailablePlayerId = (syncState, maxPlayers) => {
    const players = syncState?.players || {}

    for (let i = 0; i < maxPlayers; i += 1) {
      if (!players[i]) {
        return i
      }
    }

    return 0
  }

  const generateAccessCode = () => Math.floor(Math.random() * 10000).toString().padStart(4, '0')

  const handleAuthSuccess = (session) => {
    const storedSession = saveAuthSession(session)
    setAuthSession(storedSession)
  }

  const handleLogout = () => {
    clearAuthSession()
    setAuthSession(null)
    setUserStats(null)
    setSelectedGame(null)
    setPendingRoomData(null)
    setShowUserNamePrompt(false)
  }

  const handleSelectGame = (game) => {
    if (game === 'multiPlayerTest') {
      setMultiPlayerTest({
        roomName: 'Sala de Prueba Multijugador',
        playerCount: 3,
        difficulty: 'normal',
        maxTime: 30
      })
      return
    }

    setSelectedGame(game)
  }

  const connectUserToRoom = async (action, roomData, userName) => {
    try {
      if (action === 'create') {
        const createdRoom = await createRoom({
          ...roomData,
          accessCode: roomData.isPrivate ? generateAccessCode() : null,
          activePlayers: stringifyRoomSyncState({
            players: {
              0: {
                name: userName,
                position: { x: 0, y: 1.7, z: 5 },
                rotation: { x: 0, y: 0, z: 0 },
                lastSeen: Date.now()
              }
            },
            solvedPuzzles: []
          }),
          playerCount: 1,
          status: 'WAITING',
          lastActivity: Date.now()
        })

        sessionStorage.setItem(`PLAYER_ID:${createdRoom.roomName}`, '0')
        sessionStorage.setItem(`PLAYER_NAME:${createdRoom.roomName}:0`, userName)

        setPuzzleRoom({ ...createdRoom, playerId: 0, userName, authUser: currentUser })
      }

      if (action === 'join') {
        const latestRoom = await getRoom(roomData.id)

        if ((latestRoom.playerCount ?? 0) >= (latestRoom.maxPlayers ?? 1)) {
          alert('La sala ya esta llena.')
          return
        }

        const currentSyncState = latestRoom.activePlayers ? JSON.parse(latestRoom.activePlayers) : null
        const nextPlayerId = getNextAvailablePlayerId(currentSyncState, latestRoom.maxPlayers)
        sessionStorage.setItem(`PLAYER_ID:${latestRoom.roomName}:${nextPlayerId}`, nextPlayerId.toString())
        sessionStorage.setItem(`PLAYER_NAME:${latestRoom.roomName}:${nextPlayerId}`, userName)

        const updatedRoom = await updateRoomSyncState(latestRoom.id, (syncState, room) => ({
          ...syncState,
          players: {
            ...syncState.players,
            [nextPlayerId]: {
              name: userName,
              position: { x: Math.cos(nextPlayerId) * 8, y: 1.7, z: Math.sin(nextPlayerId) * 8 },
              rotation: { x: 0, y: 0, z: 0 },
              lastSeen: Date.now()
            }
          }
        }))

        const normalizedRoom = {
          ...updatedRoom,
          playerCount: Math.max((roomData.playerCount ?? latestRoom.playerCount ?? 0), Object.keys(JSON.parse(updatedRoom.activePlayers).players || {}).length)
        }
        setPuzzleRoom({ ...normalizedRoom, playerId: nextPlayerId, userName, authUser: currentUser })
      }

      setShowUserNamePrompt(false)
      setPendingRoomData(null)
      setSelectedGame(null)
    } catch (error) {
      console.error('Error conectando la sala con backend:', error)
      alert('No se pudo completar la operacion con la sala.')
    }
  }

  const resolveRoomUserName = () => {
    const fullName = [currentUser?.name, currentUser?.lastname].filter(Boolean).join(' ').trim()
    return fullName || currentUser?.name || ''
  }

  const handleCreateRoom = (roomData) => {
    const userName = resolveRoomUserName()

    if (userName) {
      connectUserToRoom('create', roomData, userName)
      return
    }

    setPendingRoomData({ ...roomData, action: 'create' })
    setShowUserNamePrompt(true)
  }

  const handleJoinRoom = (roomData) => {
    const userName = resolveRoomUserName()

    if (userName) {
      connectUserToRoom('join', roomData, userName)
      return
    }

    setPendingRoomData({ ...roomData, action: 'join' })
    setShowUserNamePrompt(true)
  }

  const handleUserNameConfirm = async (userName) => {
    if (!pendingRoomData) {
      return
    }

    const { action, ...roomData } = pendingRoomData
    await connectUserToRoom(action, roomData, userName)
  }

  const handleUserNameCancel = () => {
    setShowUserNamePrompt(false)
    setPendingRoomData(null)
  }

  const handleExitRoom = () => {
    if (!puzzleRoom) {
      return
    }

    clearPlayerSyncData(puzzleRoom.id, puzzleRoom.playerId)
    sessionStorage.removeItem(`PLAYER_NAME:${puzzleRoom.roomName}:${puzzleRoom.playerId}`)
    sessionStorage.removeItem(`PLAYER_ID:${puzzleRoom.roomName}:${puzzleRoom.playerId}`)
    if (puzzleRoom.playerId === 0) {
      sessionStorage.removeItem(`PLAYER_ID:${puzzleRoom.roomName}`)
    }

    setPuzzleRoom(null)
    setSelectedGame(null)
  }

  const handleSessionEnd = async (stats) => {
    if (!currentUser?.id) {
      return
    }

    try {
      const updatedStats = await saveUserSessionStats(currentUser.id, stats)
      setUserStats(updatedStats)
    } catch (error) {
      console.error('Error guardando estadisticas de sesion:', error)
    }
  }

  const refreshUserStats = async () => {
    if (!currentUser?.id) {
      setUserStats(null)
      return
    }

    try {
      const stats = await getUserStats(currentUser.id)
      setUserStats(stats)
    } catch (error) {
      console.error('Error obteniendo estadisticas del usuario:', error)
    }
  }

  useEffect(() => {
    refreshUserStats()
  }, [currentUser?.id])

  const handleExitMultiPlayerTest = () => {
    setMultiPlayerTest(null)
  }

  const renderContent = () => {
    if (!currentUser) {
      return <AuthScreen onAuthSuccess={handleAuthSuccess} />
    }

    if (multiPlayerTest) {
      return (
        <Suspense fallback={<ScreenLoader />}>
          <MultiPlayerTest roomData={multiPlayerTest} onExit={handleExitMultiPlayerTest} />
        </Suspense>
      )
    }

    if (puzzleRoom) {
      return (
        <Suspense fallback={<ScreenLoader />}>
          <PuzzleRoom3D roomData={puzzleRoom} onExit={handleExitRoom} onSessionEnd={handleSessionEnd} />
        </Suspense>
      )
    }

    if (selectedGame === 'createRoom') {
      return <RoomCreator onCreateRoom={handleCreateRoom} />
    }

    if (selectedGame === 'joinRoom') {
      return <RoomLobby onJoinRoom={handleJoinRoom} onBack={() => setSelectedGame(null)} />
    }

    return (
      <GameSelector
        onSelectGame={handleSelectGame}
        currentUser={currentUser}
        onLogout={handleLogout}
        userStats={userStats}
      />
    )
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'black',
      color: 'white'
    }}>
      {renderContent()}

      {showUserNamePrompt && pendingRoomData && (
        <UserNamePrompt
          roomName={pendingRoomData.roomName}
          onConfirm={handleUserNameConfirm}
          onCancel={handleUserNameCancel}
        />
      )}
    </div>
  )
}

export default App
