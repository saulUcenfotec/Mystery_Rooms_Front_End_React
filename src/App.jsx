import { Suspense, lazy, useState } from 'react'
import './App.css'
import GameSelector from './components/GameSelector.jsx'
import RoomCreator from './components/RoomCreator.jsx'
import RoomLobby from './components/RoomLobby.jsx'
import UserNamePrompt from './components/UserNamePrompt.jsx'
import { changeRoomPlayerCount, createRoom, getRoom } from './services/gameRooms.js'

// Delay loading the heavy Three.js views until the user actually opens them.
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

  const clearPlayerSyncData = (roomName, playerId) => {
    try {
      const syncKey = `PLAYERS_SYNC:${roomName}`
      const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')
      if (playersData[playerId] !== undefined) {
        delete playersData[playerId]
        localStorage.setItem(syncKey, JSON.stringify(playersData))
      }
    } catch (error) {
      console.error('Error limpiando datos de sincronizacion:', error)
    }
  }

  const getNextAvailablePlayerId = (roomName, maxPlayers) => {
    try {
      const syncKey = `PLAYERS_SYNC:${roomName}`
      const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')

      for (let i = 0; i < maxPlayers; i += 1) {
        if (!playersData[i]) {
          return i
        }
      }
    } catch (error) {
      console.error('Error obteniendo siguiente playerId:', error)
    }

    return 0
  }

  const generateAccessCode = () => Math.floor(Math.random() * 10000).toString().padStart(4, '0')

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

  const handleCreateRoom = (roomData) => {
    setPendingRoomData({ ...roomData, action: 'create' })
    setShowUserNamePrompt(true)
  }

  const handleJoinRoom = (roomData) => {
    setPendingRoomData({ ...roomData, action: 'join' })
    setShowUserNamePrompt(true)
  }

  const handleUserNameConfirm = async (userName) => {
    if (!pendingRoomData) {
      return
    }

    const { action, ...roomData } = pendingRoomData

    try {
      if (action === 'create') {
        const createdRoom = await createRoom({
          ...roomData,
          accessCode: roomData.isPrivate ? generateAccessCode() : null,
          activePlayers: JSON.stringify([0]),
          playerCount: 1,
          status: 'WAITING',
          lastActivity: Date.now()
        })

        sessionStorage.setItem(`PLAYER_ID:${createdRoom.roomName}`, '0')
        sessionStorage.setItem(`PLAYER_NAME:${createdRoom.roomName}:0`, userName)

        const syncKey = `PLAYERS_SYNC:${createdRoom.roomName}`
        localStorage.setItem(syncKey, JSON.stringify({
          0: {
            name: userName,
            position: { x: 0, y: 1.7, z: 5 },
            rotation: { x: 0, y: 0, z: 0 }
          }
        }))

        setPuzzleRoom({ ...createdRoom, playerId: 0, userName })
      }

      if (action === 'join') {
        const latestRoom = await getRoom(roomData.id)

        if ((latestRoom.playerCount ?? 0) >= (latestRoom.maxPlayers ?? 1)) {
          alert('La sala ya esta llena.')
          return
        }

        const nextPlayerId = getNextAvailablePlayerId(latestRoom.roomName, latestRoom.maxPlayers)
        sessionStorage.setItem(`PLAYER_ID:${latestRoom.roomName}:${nextPlayerId}`, nextPlayerId.toString())
        sessionStorage.setItem(`PLAYER_NAME:${latestRoom.roomName}:${nextPlayerId}`, userName)

        const syncKey = `PLAYERS_SYNC:${latestRoom.roomName}`
        const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')
        playersData[nextPlayerId] = {
          name: userName,
          position: { x: Math.cos(nextPlayerId) * 8, y: 1.7, z: Math.sin(nextPlayerId) * 8 },
          rotation: { x: 0, y: 0, z: 0 }
        }
        localStorage.setItem(syncKey, JSON.stringify(playersData))

        const updatedRoom = await changeRoomPlayerCount(latestRoom.id, 1)
        setPuzzleRoom({ ...updatedRoom, playerId: nextPlayerId, userName })
      }

      setShowUserNamePrompt(false)
      setPendingRoomData(null)
      setSelectedGame(null)
    } catch (error) {
      console.error('Error conectando la sala con backend:', error)
      alert('No se pudo completar la operacion con la sala.')
    }
  }

  const handleUserNameCancel = () => {
    setShowUserNamePrompt(false)
    setPendingRoomData(null)
  }

  const handleExitRoom = () => {
    if (!puzzleRoom) {
      return
    }

    clearPlayerSyncData(puzzleRoom.roomName, puzzleRoom.playerId)
    sessionStorage.removeItem(`PLAYER_NAME:${puzzleRoom.roomName}:${puzzleRoom.playerId}`)
    sessionStorage.removeItem(`PLAYER_ID:${puzzleRoom.roomName}:${puzzleRoom.playerId}`)
    if (puzzleRoom.playerId === 0) {
      sessionStorage.removeItem(`PLAYER_ID:${puzzleRoom.roomName}`)
    }

    setPuzzleRoom(null)
    setSelectedGame(null)
  }

  const handleExitMultiPlayerTest = () => {
    setMultiPlayerTest(null)
  }

  const renderContent = () => {
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
          <PuzzleRoom3D roomData={puzzleRoom} onExit={handleExitRoom} />
        </Suspense>
      )
    }

    if (selectedGame === 'createRoom') {
      return <RoomCreator onCreateRoom={handleCreateRoom} />
    }

    if (selectedGame === 'joinRoom') {
      return <RoomLobby onJoinRoom={handleJoinRoom} onBack={() => setSelectedGame(null)} />
    }

    return <GameSelector onSelectGame={handleSelectGame} />
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
