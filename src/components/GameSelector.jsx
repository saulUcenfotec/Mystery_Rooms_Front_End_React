// ========================================
// GameSelector.jsx - Pantalla Principal
// ========================================
// Selector de opciones de juego: crear sala, unirse
// a sala, modo prueba multijugador u otros juegos.
// ========================================

/**
 * Componente de botón reutilizable con estilos y efectos
 */
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
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)'
        e.target.style.boxShadow = `0 5px 20px ${color === 'cyan' ? 'rgba(0, 212, 255, 0.4)' : color === 'green' ? 'rgba(46, 213, 115, 0.4)' : 'rgba(255, 255, 0, 0.4)'}`
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = 'none'
      }}
    >
      {icon} {label}
    </button>
  )
}

function GameSelector({ onSelectGame }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>🎮 Mini Juegos</h1>
      <p>Selecciona una opción para comenzar.</p>

      {/* ============ Salas de Puzzles ============ */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#00d4ff', fontSize: '18px', marginBottom: '20px' }}>Salas de Puzzles Multijugador</h2>
        
        <GameButton
          label="Crear Nueva Sala"
          icon="➕"
          color="cyan"
          onClick={() => onSelectGame('createRoom')}
        />
        
        <GameButton
          label="Unirse a Sala Existente"
          icon="🔓"
          color="green"
          onClick={() => onSelectGame('joinRoom')}
        />
      </div>
    </div>
  )
}

export default GameSelector