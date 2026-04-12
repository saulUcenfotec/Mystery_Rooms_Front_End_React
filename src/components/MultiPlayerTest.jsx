// MultiPlayerTest.jsx - Componente para probar múltiples jugadores en una sola ventana
// Muestra múltiples vistas de la sala simultáneamente

import { useState } from 'react'
import PuzzleRoom3D from './PuzzleRoom3D.jsx'

function MultiPlayerTest({ roomData, onExit }) {
  const [selectedView, setSelectedView] = useState(0)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Selector de vista de jugador */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '2px solid #00d4ff',
          display: 'flex',
          gap: '10px'
        }}
      >
        <span style={{ color: '#00d4ff', fontWeight: 'bold' }}>Vista del Jugador:</span>
        {Array.from({ length: roomData.playerCount }, (_, i) => (
          <button
            key={i}
            onClick={() => setSelectedView(i)}
            style={{
              background: selectedView === i ? '#00d4ff' : 'transparent',
              color: selectedView === i ? '#000' : '#00d4ff',
              border: '1px solid #00d4ff',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Jugador {i + 1}
          </button>
        ))}
      </div>

      {/* Sala 3D con vista del jugador seleccionado */}
      <PuzzleRoom3D
        roomData={roomData}
        onExit={onExit}
        forcePlayerView={selectedView}
      />

      {/* Overlay informativo */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '2px solid #ffff00',
          color: '#ffff00',
          fontSize: '12px',
          textAlign: 'center'
        }}
      >
        <div>🧪 MODO PRUEBA MULTIJUGADOR</div>
        <div>Cambia entre vistas de jugadores arriba</div>
        <div>Los turnos avanzan automáticamente al completar puzzles</div>
      </div>
    </div>
  )
}

export default MultiPlayerTest
