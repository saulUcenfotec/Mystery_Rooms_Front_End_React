import { useState } from 'react'
import { loginUser, registerUser } from '../services/auth.js'

function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLogin = mode === 'login'

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const name = formData.name.trim()
    const lastname = formData.lastname.trim()
    const email = formData.email.trim()
    const password = formData.password
    const confirmPassword = formData.confirmPassword

    if (!email || !password) {
      setError('Email y password son obligatorios.')
      return
    }

    if (!isLogin) {
      if (!name) {
        setError('El nombre es obligatorio.')
        return
      }

      if (password.length < 6) {
        setError('La password debe tener al menos 6 caracteres.')
        return
      }

      if (password !== confirmPassword) {
        setError('Las passwords no coinciden.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (!isLogin) {
        await registerUser({ name, lastname, email, password })
      }

      const session = await loginUser({ email, password })
      onAuthSuccess(session)
    } catch (requestError) {
      setError(requestError.message || 'No se pudo completar la autenticacion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, rgba(0, 212, 255, 0.18), transparent 35%), linear-gradient(145deg, #020617 0%, #07111f 45%, #020617 100%)',
      color: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '980px',
        display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr',
        borderRadius: '22px',
        overflow: 'hidden',
        border: '1px solid rgba(34, 211, 238, 0.22)',
        background: 'rgba(2, 6, 23, 0.88)',
        boxShadow: '0 24px 90px rgba(0, 0, 0, 0.45)'
      }}>
        <div style={{
          padding: '48px',
          background: 'linear-gradient(165deg, rgba(8, 47, 73, 0.92) 0%, rgba(8, 145, 178, 0.2) 100%)'
        }}>
          <div style={{ fontSize: '12px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#67e8f9', marginBottom: '18px' }}>
            Mystery Rooms
          </div>
          <h1 style={{ fontSize: '42px', lineHeight: 1.05, margin: '0 0 18px' }}>
            Accede a tu sesion antes de entrar a la sala.
          </h1>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.7, color: 'rgba(226, 232, 240, 0.86)' }}>
            El frontend ahora utiliza usuarios reales del backend. Tu nombre autenticado se usa para darte la bienvenida y para identificarte dentro de las salas.
          </p>
          <div style={{
            marginTop: '28px',
            display: 'grid',
            gap: '12px',
            color: '#cbd5e1',
            fontSize: '14px'
          }}>
            <div>Login con email y password.</div>
            <div>Registro con nombre visible para multiplayer.</div>
            <div>Sesion persistida localmente hasta expirar.</div>
          </div>
        </div>

        <div style={{ padding: '40px 36px' }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.9)',
            borderRadius: '999px',
            padding: '4px',
            marginBottom: '28px',
            border: '1px solid rgba(148, 163, 184, 0.18)'
          }}>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                padding: '10px 18px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: isLogin ? '#22d3ee' : 'transparent',
                color: isLogin ? '#020617' : '#cbd5e1',
                fontWeight: 700
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              style={{
                padding: '10px 18px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: !isLogin ? '#22d3ee' : 'transparent',
                color: !isLogin ? '#020617' : '#cbd5e1',
                fontWeight: 700
              }}
            >
              Registro
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            {!isLogin && (
              <input
                type="text"
                value={formData.name}
                onChange={(event) => handleChange('name', event.target.value)}
                placeholder="Nombre visible"
                style={inputStyle}
              />
            )}

            {!isLogin && (
              <input
                type="text"
                value={formData.lastname}
                onChange={(event) => handleChange('lastname', event.target.value)}
                placeholder="Apellido (opcional)"
                style={inputStyle}
              />
            )}

            <input
              type="email"
              value={formData.email}
              onChange={(event) => handleChange('email', event.target.value)}
              placeholder="Email"
              autoComplete="email"
              style={inputStyle}
            />

            <input
              type="password"
              value={formData.password}
              onChange={(event) => handleChange('password', event.target.value)}
              placeholder="Password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              style={inputStyle}
            />

            {!isLogin && (
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(event) => handleChange('confirmPassword', event.target.value)}
                placeholder="Confirmar password"
                autoComplete="new-password"
                style={inputStyle}
              />
            )}

            {error && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(248, 113, 113, 0.35)',
                color: '#fecaca',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '8px',
                padding: '14px 18px',
                borderRadius: '14px',
                border: 'none',
                cursor: isSubmitting ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
                color: '#020617',
                fontWeight: 800,
                fontSize: '15px'
              }}
            >
              {isSubmitting ? 'Procesando...' : isLogin ? 'Entrar' : 'Crear cuenta y entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'rgba(15, 23, 42, 0.85)',
  color: '#f8fafc',
  fontSize: '15px',
  boxSizing: 'border-box'
}

export default AuthScreen
