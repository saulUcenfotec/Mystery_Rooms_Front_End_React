import { useMemo, useState } from 'react'
import '../styles/DataReconstructionPuzzle.css'

const SOURCE_BLOCKS = [
  'BLK_04',
  'BLK_01',
  'BLK_07',
  'BLK_02',
  'BLK_05',
  'BLK_08',
  'BLK_03',
  'BLK_06'
]

const TARGET_SEQUENCE = [
  'BLK_01',
  'BLK_02',
  'BLK_03',
  'BLK_04',
  'BLK_05',
  'BLK_06',
  'BLK_07',
  'BLK_08'
]

function DataReconstructionPuzzle({ onClose, onComplete, onSuccess, onFail }) {
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [assembledBlocks, setAssembledBlocks] = useState(Array(8).fill(null))
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('Arrastra o selecciona bloques para reconstruir el archivo.')

  const availableBlocks = useMemo(
    () => SOURCE_BLOCKS.filter((block) => !assembledBlocks.includes(block)),
    [assembledBlocks]
  )

  const placeBlock = (slotIndex, blockValue) => {
    if (!blockValue || assembledBlocks[slotIndex]) {
      return
    }

    const nextBlocks = [...assembledBlocks]
    nextBlocks[slotIndex] = blockValue
    setAssembledBlocks(nextBlocks)
    setSelectedBlock(null)
    setStatus('idle')
    setMessage('Bloque insertado. Continúa con la reconstrucción.')
  }

  const removeBlock = (slotIndex) => {
    if (!assembledBlocks[slotIndex]) {
      return
    }

    const nextBlocks = [...assembledBlocks]
    nextBlocks[slotIndex] = null
    setAssembledBlocks(nextBlocks)
    setStatus('idle')
    setMessage('Bloque retirado del destino.')
  }

  const validateSequence = () => {
    const solved = assembledBlocks.every((block, index) => block === TARGET_SEQUENCE[index])

    if (!solved) {
      if (onFail) {
        onFail()
      }
      setStatus('error')
      setMessage('Secuencia incorrecta. Revisa el orden antes de restaurar el archivo.')
      return
    }

    if (onSuccess) {
      onSuccess()
    }
    setStatus('success')
    setMessage('Archivo restaurado. Fragmento de algoritmo #3 desbloqueado.')
    if (onComplete) {
      window.setTimeout(() => onComplete('dataReconstruction'), 600)
    }
  }

  return (
    <div className="data-reconstruction-overlay">
      <div className="data-reconstruction-shell">
        <div className="data-reconstruction-copy">
          <h2>Reconstruccion de Datos - Terminal Corrupta</h2>
          <p>
            El jugador encuentra el archivo <strong>VOSS_RESEARCH_V3.DAT</strong> fragmentado en 8 bloques desordenados.
            Debe restaurarlos en la cuadricula de destino en el orden correcto.
          </p>
          <p>
            Conexion narrativa: el archivo restaurado revela que el Dr. Voss detecto un patron de colapso social en 18 meses.
            Fragmento de algoritmo #3 desbloqueado.
          </p>
        </div>

        <div className="data-reconstruction-panel">
          <div className="data-reconstruction-panel-title">ARCHIVO CORRUPTO - RECONSTRUIR BLOQUES</div>
          <div className="data-reconstruction-panel-subtitle">
            Arrastra los bloques al area de destino en el orden correcto:
          </div>

          <div className="data-reconstruction-source">
            {SOURCE_BLOCKS.map((block) => {
              const disabled = !availableBlocks.includes(block)
              return (
                <button
                  key={block}
                  type="button"
                  draggable={!disabled}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', block)
                    setSelectedBlock(block)
                  }}
                  onClick={() => !disabled && setSelectedBlock(block)}
                  disabled={disabled}
                  className={[
                    'data-block',
                    selectedBlock === block ? 'selected' : '',
                    disabled ? 'used' : '',
                    block === 'BLK_07' ? 'accent' : ''
                  ].join(' ').trim()}
                >
                  {block}
                </button>
              )
            })}
          </div>

          <div
            className="data-reconstruction-target"
            onDragOver={(event) => event.preventDefault()}
          >
            <div className="data-reconstruction-target-label">AREA DE DESTINO:</div>
            <div className="data-reconstruction-slots">
              {assembledBlocks.map((block, index) => (
                <button
                  key={`slot-${index}`}
                  type="button"
                  className={`data-slot ${block ? 'filled' : ''}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    placeBlock(index, event.dataTransfer.getData('text/plain'))
                  }}
                  onClick={() => {
                    if (block) {
                      removeBlock(index)
                      return
                    }
                    placeBlock(index, selectedBlock)
                  }}
                >
                  {block || '[__]'}
                </button>
              ))}
            </div>
          </div>

          <div className={`data-reconstruction-message ${status}`}>
            {message}
          </div>

          <div className="data-reconstruction-actions">
            <button type="button" onClick={validateSequence} className="data-action primary">
              Restaurar archivo
            </button>
            <button
              type="button"
              onClick={() => {
                setAssembledBlocks(Array(8).fill(null))
                setSelectedBlock(null)
                setStatus('idle')
                setMessage('Puzzle reiniciado.')
              }}
              className="data-action"
            >
              Reiniciar
            </button>
            <button type="button" onClick={onClose} className="data-action">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataReconstructionPuzzle
