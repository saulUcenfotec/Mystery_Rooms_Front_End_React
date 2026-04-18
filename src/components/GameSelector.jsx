// ========================================
// GameSelector.jsx - Pantalla Principal
// ========================================

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const GameButton = ({ label, icon, color, onClick }) => {
  const gradients = {
    cyan: 'linear-gradient(135deg, #00d4ff 0%, #0097a7 100%)',
    green: 'linear-gradient(135deg, #2ed573 0%, #16a34a 100%)',
    yellow: 'linear-gradient(135deg, #ffff00 0%, #ff8c00 100%)',
    gray: '#444'
  }

  return (
    <button
      onClick={onClick}
      style={{
        padding: color !== 'gray' ? '15px 25px' : '10px 20px',
        fontSize: '16px',
        margin: '10px',
        background: gradients[color] || color,
        color: '#000',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(event) => {
        event.target.style.transform = 'translateY(-2px)'
        event.target.style.boxShadow = `0 5px 20px ${color === 'cyan' ? 'rgba(0, 212, 255, 0.4)' : color === 'green' ? 'rgba(46, 213, 115, 0.4)' : 'rgba(255, 255, 0, 0.4)'}`
      }}
      onMouseLeave={(event) => {
        event.target.style.transform = 'translateY(0)'
        event.target.style.boxShadow = 'none'
      }}
    >
      {icon} {label}
    </button>
  )
}

function GameSelector({ onSelectGame, currentUser, onLogout, userStats }) {
  const statsCards = [
    {
      label: 'Sesiones jugadas',
      value: userStats?.sessionsPlayed ?? 0
    },
    {
      label: 'Promedio por sesion',
      value: formatDuration(userStats?.averageSessionSeconds ?? 0)
    },
    {
      label: 'Promedio por puzzle',
      value: formatDuration(userStats?.averagePuzzleSolveSeconds ?? 0)
    },
    {
      label: 'Aciertos promedio',
      value: (userStats?.averageSuccesses ?? 0).toFixed(1)
    },
    {
      label: 'Fallos promedio',
      value: (userStats?.averageFailures ?? 0).toFixed(1)
    },
    {
      label: 'Puzzles resueltos promedio',
      value: (userStats?.averagePuzzlesSolved ?? 0).toFixed(1)
    }
  ]

  return (
    <div style={{ textAlign: 'center', width: '100%', maxWidth: '860px', padding: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        padding: '14px 18px',
        borderRadius: '14px',
        background: 'rgba(0, 212, 255, 0.08)',
        border: '1px solid rgba(0, 212, 255, 0.24)'
      }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '12px', color: '#9fdfff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Sesion activa
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Bienvenido, {currentUser?.name || 'Jugador'}
          </div>
          <div style={{ fontSize: '13px', color: '#b6c7d9' }}>
            {currentUser?.email}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            background: 'rgba(127, 29, 29, 0.35)',
            color: '#fecaca',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Cerrar sesion
        </button>
      </div>

      <h1>Mini Juegos</h1>
      <p>Selecciona una opcion para comenzar.</p>

      <div style={{
        margin: '0 auto 30px',
        padding: '20px',
        borderRadius: '16px',
        background: 'rgba(8, 15, 30, 0.88)',
        border: '1px solid rgba(0, 212, 255, 0.22)',
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.28)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '12px', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Tus estadisticas
            </div>
            <div style={{ fontSize: '14px', color: '#b6c7d9' }}>
              Promedios calculados con todas tus sesiones guardadas.
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}>
          {statsCards.map((card) => (
            <div
              key={card.label}
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'linear-gradient(180deg, rgba(10, 29, 56, 0.96) 0%, rgba(5, 15, 30, 0.96) 100%)',
                border: '1px solid rgba(0, 212, 255, 0.18)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '12px', color: '#8fbad6', marginBottom: '8px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#f8fdff' }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#00d4ff', fontSize: '18px', marginBottom: '20px' }}>
          Salas de Puzzles Multijugador
        </h2>

        <GameButton
          label="Crear Nueva Sala"
          icon="+"
          color="cyan"
          onClick={() => onSelectGame('createRoom')}
        />

        <GameButton
          label="Unirse a Sala Existente"
          icon="#"
          color="green"
          onClick={() => onSelectGame('joinRoom')}
        />
      </div>
    </div>
  )
}

export default GameSelector
