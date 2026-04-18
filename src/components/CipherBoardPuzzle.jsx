import { useMemo, useState } from 'react'
import '../styles/CipherBoardPuzzle.css'

const SYMBOL_ROWS = [
  ['ϟ', 'Ι', 'Ψ', 'Δ', 'Ε', 'Ω', 'Ν', 'Λ'],
  ['Φ', 'C', 'Σ', 'U', 'Ξ', 'Τ', 'Π', 'Θ']
]

const SYMBOL_TO_LETTER = {
  'Ν': 'Y',
  'C': 'C',
  'Θ': 'O',
  'Τ': 'T',
  'Φ': 'R',
  'Σ': 'A',
  'Ω': 'A',
  'Ι': 'I',
  'ϟ': 'S',
  'Δ': 'E',
  'Ε': 'E',
  'Λ': 'S',
  'Ψ': 'Q',
  'U': 'U',
  'Ξ': 'M',
  'Π': 'G'
}

const EXPECTED_CODE = '7-4-SIGMA'

function CipherBoardPuzzle({ onClose, onComplete, onSuccess, onFail }) {
  const [codeInput, setCodeInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('Usa la tabla parcial y descifra el mensaje para obtener la combinacion.')

  const decodedPreview = useMemo(
    () => SYMBOL_ROWS.map((row) => row.map((symbol) => SYMBOL_TO_LETTER[symbol] || '?').join(' ')).join('  |  '),
    []
  )

  const handleValidate = () => {
    if (codeInput.trim().toUpperCase() !== EXPECTED_CODE) {
      if (onFail) {
        onFail()
      }
      setStatus('error')
      setMessage('Codigo incorrecto. El mensaje sugiere una secuencia concreta.')
      return
    }

    if (onSuccess) {
      onSuccess()
    }
    setStatus('success')
    setMessage('Mensaje descifrado. La combinacion correcta es 7-4-SIGMA.')
    if (onComplete) {
      window.setTimeout(() => onComplete('cipherBoard'), 600)
    }
  }

  return (
    <div className="cipher-board-overlay">
      <div className="cipher-board-shell">
        <div className="cipher-board-copy">
          <h2>Codigo Cifrado - Pizarra de Simbolos</h2>
          <p>
            La pizarra muestra un mensaje en un sistema de sustitucion que el Dr. Voss diseno.
            Debes usar la tabla parcial para descifrar la combinacion de la caja fuerte.
          </p>
          <p>
            Conexion narrativa: el mensaje dice "SI ENCUENTRAS ESTO, ES QUE YA ES DEMASIADO TARDE.
            EL CODIGO ES 7-4-SIGMA."
          </p>
        </div>

        <div className="cipher-board-panel">
          <div className="cipher-board-title">MENSAJE ENCRIPTADO - DESCIFRAR</div>

          <div className="cipher-board-grid">
            {SYMBOL_ROWS.flat().map((symbol) => (
              <div key={symbol} className="cipher-symbol-box">
                <span className="cipher-symbol">{symbol}</span>
                <span className="cipher-letter">{SYMBOL_TO_LETTER[symbol] || '?'}</span>
              </div>
            ))}
          </div>

          <div className="cipher-board-substitution">
            Tabla de sustitucion parcial:
            {' '}
            Ψ=Q · Δ=E · Θ=O · Λ=S · Τ=T · Φ=R · Σ=A
          </div>

          <div className="cipher-board-preview">
            Vista reconstruida: {decodedPreview}
          </div>

          <div className="cipher-board-inputs">
            <label htmlFor="cipher-code">Codigo final</label>
            <input
              id="cipher-code"
              type="text"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
              placeholder="Ej: 7-4-SIGMA"
            />
          </div>

          <div className={`cipher-board-message ${status}`}>{message}</div>

          <div className="cipher-board-actions">
            <button type="button" className="cipher-action primary" onClick={handleValidate}>
              Validar
            </button>
            <button
              type="button"
              className="cipher-action"
              onClick={() => {
                setCodeInput('')
                setStatus('idle')
                setMessage('Puzzle reiniciado.')
              }}
            >
              Reiniciar
            </button>
            <button type="button" className="cipher-action" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CipherBoardPuzzle
