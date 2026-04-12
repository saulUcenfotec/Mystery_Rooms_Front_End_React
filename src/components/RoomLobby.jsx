import { useEffect, useState } from 'react'
import { listRooms } from '../services/gameRooms.js'
import '../styles/RoomLobby.css'

function RoomLobby({ onJoinRoom, onBack }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [pendingRoom, setPendingRoom] = useState(null)

  const loadRooms = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await listRooms({ hasSpace: true })
      setRooms(response)
    } catch (loadError) {
      console.error('Error cargando salas:', loadError)
      setError('No se pudieron cargar las salas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRooms()
    const interval = setInterval(loadRooms, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleJoinRoom = (room) => {
    if (room.isPrivate) {
      setPendingRoom(room)
      setCodeInput('')
      return
    }

    onJoinRoom(room)
  }

  const handleSubmitCode = () => {
    if (!pendingRoom) {
      return
    }

    if (codeInput.trim() === pendingRoom.accessCode) {
      onJoinRoom(pendingRoom)
      setPendingRoom(null)
      setCodeInput('')
      return
    }

    alert('Codigo incorrecto')
    setCodeInput('')
  }

  const handleCancelCode = () => {
    setPendingRoom(null)
    setCodeInput('')
  }

  return (
    <div className="room-lobby-container">
      <div className="room-lobby-card">
        <h1>Unirse a una Sala</h1>
        <p>Selecciona una sala disponible para unirte</p>

        {pendingRoom && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              padding: '30px',
              borderRadius: '12px',
              border: '2px solid #ff6b35',
              color: '#fff',
              textAlign: 'center',
              width: '300px'
            }}>
              <h2 style={{ marginTop: 0, color: '#ff6b35' }}>Sala Privada</h2>
              <p style={{ color: '#aaa', marginBottom: '20px' }}>
                Ingresa el codigo de acceso para la sala "{pendingRoom.roomName}"
              </p>
              <input
                type="text"
                maxLength="4"
                placeholder="0000"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitCode()}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '24px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  marginBottom: '15px',
                  borderRadius: '6px',
                  border: '2px solid #ff6b35',
                  background: 'rgba(255, 107, 53, 0.1)',
                  color: '#fff'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSubmitCode}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#ff6b35',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Entrar
                </button>
                <button
                  onClick={handleCancelCode}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255, 107, 53, 0.3)',
                    color: '#ff6b35',
                    border: '2px solid #ff6b35',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Cargando salas...</div>
        ) : error ? (
          <div className="no-rooms">
            <p>{error}</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="no-rooms">
            <p>No hay salas disponibles en este momento.</p>
            <p style={{ fontSize: '12px', color: '#aaa' }}>
              Crea una nueva sala o espera a que alguien mas cree una.
            </p>
          </div>
        ) : (
          <div className="rooms-list">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <h3>
                    {room.isPrivate ? 'Privada ' : 'Publica '}{room.roomName}
                  </h3>
                  <span className={`status ${room.playerCount >= room.maxPlayers ? 'full' : 'open'}`}>
                    {room.playerCount >= room.maxPlayers ? 'Llena' : 'Abierta'}
                  </span>
                </div>
                <div className="room-details">
                  <div className="detail">
                    <span className="label">Jugadores:</span>
                    <span className="value">{room.playerCount} / {room.maxPlayers}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Dificultad:</span>
                    <span className="value">{room.difficulty}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Tiempo:</span>
                    <span className="value">{room.maxTime} min</span>
                  </div>
                  {room.description && (
                    <div className="detail">
                      <span className="label">Descripcion:</span>
                      <span className="value">{room.description}</span>
                    </div>
                  )}
                  {room.isPrivate && (
                    <div className="detail" style={{ color: '#ff6b35' }}>
                      <span className="label">Acceso:</span>
                      <span className="value">Requiere codigo</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleJoinRoom(room)}
                  disabled={room.playerCount >= room.maxPlayers}
                  className={`btn-join ${room.playerCount >= room.maxPlayers ? 'disabled' : ''}`}
                >
                  {room.playerCount >= room.maxPlayers ? 'Sala Llena' : 'Unirse'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="lobby-buttons">
          <button onClick={loadRooms} className="btn-refresh">
            Actualizar
          </button>
          <button onClick={onBack} className="btn-back">
            Atras
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoomLobby
