import { useState } from 'react'
import '../styles/RoomCreator.css'

function RoomCreator({ onCreateRoom }) {
  const [formData, setFormData] = useState({
    roomName: '',
    maxPlayers: 1,
    difficulty: 'normal',
    maxTime: 60,
    isPrivate: false,
    description: ''
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'maxPlayers' || name === 'maxTime' ? parseInt(value, 10) : value
    }))

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.roomName.trim()) {
      newErrors.roomName = 'El nombre de la sala es requerido'
    }

    if (formData.maxPlayers < 1 || formData.maxPlayers > 10) {
      newErrors.maxPlayers = 'La cantidad debe ser entre 1 y 10 jugadores'
    }

    if (formData.maxTime < 5 || formData.maxTime > 300) {
      newErrors.maxTime = 'El tiempo debe ser entre 5 y 300 minutos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      onCreateRoom({
        ...formData,
        playerCount: 1
      })
    }
  }

  return (
    <div className="room-creator-container">
      <div className="room-creator-card">
        <h1>Crear Sala de Puzzles</h1>
        <form onSubmit={handleSubmit} className="room-form">
          <div className="form-group">
            <label htmlFor="roomName">Nombre de la Sala</label>
            <input
              type="text"
              id="roomName"
              name="roomName"
              value={formData.roomName}
              onChange={handleChange}
              placeholder="Ej: Sala Aventurera"
              maxLength="30"
            />
            {errors.roomName && <span className="error">{errors.roomName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="maxPlayers">Cantidad de Jugadores</label>
            <input
              type="number"
              id="maxPlayers"
              name="maxPlayers"
              value={formData.maxPlayers}
              onChange={handleChange}
              min="1"
              max="10"
            />
            {errors.maxPlayers && <span className="error">{errors.maxPlayers}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Dificultad</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
            >
              <option value="facil">Facil</option>
              <option value="normal">Normal</option>
              <option value="dificil">Dificil</option>
              <option value="extremo">Extremo</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="maxTime">Tiempo Maximo (minutos)</label>
            <input
              type="number"
              id="maxTime"
              name="maxTime"
              value={formData.maxTime}
              onChange={handleChange}
              min="5"
              max="300"
              step="5"
            />
            {errors.maxTime && <span className="error">{errors.maxTime}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="isPrivate" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Sala Privada (requiere codigo de acceso)</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripcion</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe la sala o las reglas basicas"
              maxLength="180"
              rows="4"
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-create">
              Crear Sala
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoomCreator
