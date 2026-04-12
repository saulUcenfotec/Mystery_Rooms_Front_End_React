// ========================================
// UserNamePrompt.jsx - Modal para ingresar nombre de usuario
// ========================================
// Modal que aparece cuando un usuario entra a una sala
// para pedir su nombre y asegurar que sea único
// ========================================

import { useState, useEffect } from 'react'
import './UserNamePrompt.css'

function UserNamePrompt({ roomName, onConfirm, onCancel }) {
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  // Verificar si el nombre ya está en uso en la sala
  const checkNameAvailability = (name) => {
    if (!name.trim()) return false

    try {
      const syncKey = `PLAYERS_SYNC:${roomName}`
      const playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')

      // Verificar si algún jugador ya tiene este nombre
      return !Object.values(playersData).some(player =>
        player.name && player.name.toLowerCase() === name.toLowerCase().trim()
      )
    } catch (error) {
      console.error('Error verificando disponibilidad del nombre:', error)
      // En caso de error, asumir que el nombre está disponible para no bloquear al usuario
      return true
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedName = userName.trim()

    if (!trimmedName) {
      setError('Por favor ingresa un nombre')
      return
    }

    if (trimmedName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    if (trimmedName.length > 20) {
      setError('El nombre no puede tener más de 20 caracteres')
      return
    }

    // Validar caracteres permitidos (letras, números, espacios, guiones, underscores)
    const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/
    if (!validNameRegex.test(trimmedName)) {
      setError('El nombre solo puede contener letras, números, espacios, guiones y underscores')
      return
    }

    setIsChecking(true)
    setError('')

    try {
      // Verificar disponibilidad del nombre
      if (checkNameAvailability(trimmedName)) {
        setIsChecking(false)
        onConfirm(trimmedName)
      } else {
        setError('Este nombre ya está en uso en la sala. Elige otro.')
        setIsChecking(false)
      }
    } catch (error) {
      console.error('Error durante la verificación:', error)
      setError('Error al verificar el nombre. Inténtalo de nuevo.')
      setIsChecking(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    } else if (e.key === 'Escape') {
      onCancel && onCancel()
    }
  }

  useEffect(() => {
    // Enfocar el input automáticamente
    const input = document.getElementById('username-input')
    if (input) input.focus()
  }, [])

  return (
    <div className="username-prompt-overlay">
      <div className="username-prompt-modal">
        <div className="username-prompt-header">
          <h2>🎮 Ingresa tu nombre</h2>
          <p>Elige un nombre único para jugar en la sala <strong>{roomName}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="username-prompt-form">
          <div className="input-group">
            <label htmlFor="username-input">Nombre de usuario:</label>
            <input
              id="username-input"
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value)
                setError('') // Limpiar error al escribir
              }}
              onKeyPress={handleKeyPress}
              placeholder="Tu nombre..."
              maxLength={20}
              disabled={isChecking}
              className={error ? 'error' : ''}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="username-prompt-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn-cancel"
              disabled={isChecking}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-confirm"
              disabled={!userName.trim() || isChecking}
            >
              {isChecking ? 'Verificando...' : 'Continuar'}
            </button>
          </div>
        </form>

        <div className="username-prompt-footer">
          <small>
            💡 Tu nombre será visible para otros jugadores en la sala
          </small>
        </div>
      </div>
    </div>
  )
}

export default UserNamePrompt