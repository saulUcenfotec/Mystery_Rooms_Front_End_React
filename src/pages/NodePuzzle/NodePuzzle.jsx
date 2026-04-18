// NodePuzzle.jsx - Componente principal del juego de nodos
// Renderiza el grid SVG y maneja la UI del puzzle

import { useEffect, useState } from 'react'
import { useNodePuzzle } from './hooks/useNodePuzzle.js'

function NodePuzzle({ onClose, onSolved, onComplete, onSuccess, onFail, currentPlayer }) {
  // Usar el hook personalizado para obtener toda la lógica del juego
  const {
    grid,
    fixedGreens,
    redPoints,
    activeSet,
    isGameOver,
    isWon,
    toggle,
    checkWin
  } = useNodePuzzle()

  const TIME_LIMIT = 60 // segundos
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [failureReported, setFailureReported] = useState(false)
  const [successReported, setSuccessReported] = useState(false)

  useEffect(() => {
    if (!isWon || successReported) return

    if (onSuccess) {
      onSuccess()
    }

    setSuccessReported(true)
    if (onComplete) onComplete()
    else if (onSolved) onSolved()
  }, [isWon, onComplete, onSolved, onSuccess, successReported])

  useEffect(() => {
    const didFail = isGameOver || timeLeft <= 0
    if (!didFail || failureReported || isWon) {
      return
    }

    if (onFail) {
      onFail()
    }
    setFailureReported(true)
  }, [failureReported, isGameOver, isWon, onFail, timeLeft])

  // Temporizador del puzzle
  useEffect(() => {
    if (isGameOver || isWon) return
    if (timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, isGameOver, isWon])

  // Dimensiones del SVG
  const size = 50
  const padding = 10
  const svgSize = size * 5 + padding * 2

  const canInteract = !isGameOver && !isWon && timeLeft > 0

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'black',
        padding: '20px',
        borderRadius: '10px',
        position: 'relative',
        color: 'white'
      }}>
        {/* Botón para cerrar el juego */}
        <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'white', color: 'black', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        <h2>Grid 5x5 de Nodos</h2>
        {currentPlayer && (
          <div style={{ 
            background: 'rgba(0, 212, 255, 0.2)', 
            padding: '8px 12px', 
            borderRadius: '5px', 
            marginBottom: '10px',
            border: '1px solid #00d4ff',
            display: 'inline-block'
          }}>
            <span style={{ color: '#00d4ff', fontWeight: 'bold' }}>
              🎮 Jugador {currentPlayer} está jugando
            </span>
          </div>
        )}
        <p>Conecta el inicio verde (esquina superior izquierda) con el final verde (esquina inferior derecha), pasando por todos los puntos rojos. Solo puedes activar nodos adyacentes a nodos verdes activos. No más de 2 conexiones por nodo.</p>
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Tiempo restante: {timeLeft}s</div>
        {timeLeft <= 0 && <p style={{ color: 'orange', fontWeight: 'bold' }}>¡Tiempo agotado!</p>}
        <svg width={svgSize} height={svgSize}>
          {/* Renderizar cada fila y columna del grid */}
          {grid.map((row, i) => row.map((active, j) => {
            const cx = padding + j * size + size / 2
            const cy = padding + i * size + size / 2
            const isFixed = fixedGreens.some(p => p.row === i && p.col === j)
            const isRed = redPoints.some(p => p.row === i && p.col === j)
            const activeKey = `${i}-${j}`

            const lines = []
            if (activeSet.has(activeKey)) {
              if (j < 4 && activeSet.has(`${i}-${j + 1}`)) {
                lines.push(
                  <line
                    key={`${i}-${j}-h`}
                    x1={cx + size * 0.35}
                    y1={cy}
                    x2={cx + size - size * 0.35}
                    y2={cy}
                    stroke='green'
                    strokeWidth={4}
                    strokeLinecap='round'
                  />
                )
              }
              if (i < 4 && activeSet.has(`${i + 1}-${j}`)) {
                lines.push(
                  <line
                    key={`${i}-${j}-v`}
                    x1={cx}
                    y1={cy + size * 0.35}
                    x2={cx}
                    y2={cy + size - size * 0.35}
                    stroke='green'
                    strokeWidth={4}
                    strokeLinecap='round'
                  />
                )
              }
            }

            let fill = 'lightgray'
            if (isFixed) fill = 'green'
            else if (isRed) fill = 'red'
            else if (active) fill = 'white'

            return (
              <g key={`${i}-${j}`}>
                {lines}
                <circle
                  cx={cx}
                  cy={cy}
                  r={size * 0.35}
                  fill={fill}
                  stroke='black'
                  strokeWidth={2}
                  style={{ cursor: isFixed || !canInteract ? 'not-allowed' : 'pointer' }}
                  onClick={() => canInteract && toggle(i, j)}
                />
              </g>
            )
          }))}
        </svg>
        {isGameOver && <p style={{ color: 'red', fontWeight: 'bold' }}>¡Juego perdido! Un nodo tiene más de 2 conexiones.</p>}
        {checkWin() && !isGameOver && <p style={{ color: 'green', fontWeight: 'bold' }}>¡Puzzle resuelto!</p>}
      </div>
    </div>
  )
}

export default NodePuzzle
