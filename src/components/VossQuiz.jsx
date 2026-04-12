import { useEffect, useMemo, useState } from 'react'
import { VOSS_QUIZ_SCENARIOS } from '../data/vossQuizData.js'
import '../styles/VossQuiz.css'

const INITIAL_TIME_SECONDS = 45 * 60

function VossQuiz({ onClose, onComplete }) {
  const scenarios = useMemo(() => VOSS_QUIZ_SCENARIOS, [])
  const [scenarioStates, setScenarioStates] = useState(['pending', 'pending', 'pending'])
  const [failuresByScenario, setFailuresByScenario] = useState([0, 0, 0])
  const [feedbackByScenario, setFeedbackByScenario] = useState(['', '', ''])
  const [messagesByScenario, setMessagesByScenario] = useState(scenarios.map((scenario) => scenario.messages.idle))
  const [score, setScore] = useState(1000)
  const [totalFailures, setTotalFailures] = useState(0)
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME_SECONDS)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (completed) {
      return undefined
    }

    const timerId = setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1))
    }, 1000)

    return () => clearInterval(timerId)
  }, [completed])

  const solvedCount = scenarioStates.filter((state) => state === 'correct').length
  const progress = (solvedCount / scenarios.length) * 100
  const timerDisplay = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`

  const handleSelectOption = (scenarioIndex, optionIndex) => {
    if (scenarioStates[scenarioIndex] === 'correct' || completed) {
      return
    }

    const scenario = scenarios[scenarioIndex]
    const option = scenario.options[optionIndex]

    if (option.isCorrect) {
      const nextStates = [...scenarioStates]
      nextStates[scenarioIndex] = 'correct'
      setScenarioStates(nextStates)

      const nextFeedback = [...feedbackByScenario]
      nextFeedback[scenarioIndex] = option.feedback
      setFeedbackByScenario(nextFeedback)

      const nextMessages = [...messagesByScenario]
      nextMessages[scenarioIndex] = scenario.messages.correct
      setMessagesByScenario(nextMessages)

      if (nextStates.filter((state) => state === 'correct').length === scenarios.length) {
        setCompleted(true)
        if (onComplete) {
          window.setTimeout(() => onComplete('vossQuiz'), 800)
        }
      }

      return
    }

    const nextStates = [...scenarioStates]
    nextStates[scenarioIndex] = 'incorrect'
    setScenarioStates(nextStates)

    const nextFeedback = [...feedbackByScenario]
    nextFeedback[scenarioIndex] = option.feedback
    setFeedbackByScenario(nextFeedback)

    const nextMessages = [...messagesByScenario]
    nextMessages[scenarioIndex] = scenario.messages.wrong
    setMessagesByScenario(nextMessages)

    const nextFailures = [...failuresByScenario]
    nextFailures[scenarioIndex] += 1
    setFailuresByScenario(nextFailures)

    setTotalFailures((current) => current + 1)
    setScore((current) => Math.max(0, current - 80))

    window.setTimeout(() => {
      setScenarioStates((current) => {
        if (current[scenarioIndex] !== 'incorrect') {
          return current
        }

        const retryStates = [...current]
        retryStates[scenarioIndex] = 'pending'
        return retryStates
      })
    }, 1000)
  }

  return (
    <div className="voss-quiz-overlay">
      <div className="voss-quiz-shell">
        <div className="voss-quiz-header">
          <div>
            <span className="voss-quiz-tag">SIMULACION · DECISION IA</span>
            <h2>Test de Logica Estrategica</h2>
            <p>Se extrajo solo el modulo de preguntas y respuestas del ejercicio original.</p>
          </div>
          <div className="voss-quiz-actions">
            <div className={`voss-quiz-timer ${timeLeft <= 600 ? 'danger' : ''}`}>{timerDisplay}</div>
            <button type="button" onClick={onClose} className="voss-quiz-close">Cerrar</button>
          </div>
        </div>

        <div className="voss-quiz-stats">
          <div><span>Puntuacion</span><strong>{score}</strong></div>
          <div><span>Intentos fallidos</span><strong>{totalFailures}</strong></div>
          <div><span>Progreso</span><strong>{solvedCount} / {scenarios.length}</strong></div>
        </div>

        <div className="voss-quiz-progress">
          <div className="voss-quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {!completed ? (
          <div className="voss-quiz-scenarios">
            {scenarios.map((scenario, scenarioIndex) => (
              <section
                key={scenario.id}
                className={`voss-quiz-card ${scenarioStates[scenarioIndex] === 'correct' ? 'solved' : ''}`}
              >
                <div className="voss-quiz-card-top">
                  <span>{scenario.label}</span>
                  <span>{scenarioStates[scenarioIndex] === 'correct' ? 'RESUELTO' : 'PENDIENTE'}</span>
                </div>

                <div className="voss-quiz-question">
                  <div className="voss-quiz-question-label">DILEMA ETICO · ALGORITMO VOSS</div>
                  <p>{scenario.question}</p>
                </div>

                <div className="voss-quiz-attempts">
                  {Array.from({ length: failuresByScenario[scenarioIndex] }).map((_, index) => (
                    <span key={`${scenario.id}-${index}`} className="voss-quiz-attempt-dot" />
                  ))}
                </div>

                <div className="voss-quiz-options">
                  {scenario.options.map((option, optionIndex) => (
                    <button
                      key={`${scenario.id}-${optionIndex}`}
                      type="button"
                      className={[
                        'voss-quiz-option',
                        scenarioStates[scenarioIndex] === 'correct' && option.isCorrect ? 'correct' : '',
                        scenarioStates[scenarioIndex] === 'incorrect' ? 'wrong' : '',
                        scenarioStates[scenarioIndex] === 'correct' && !option.isCorrect ? 'locked' : ''
                      ].join(' ').trim()}
                      disabled={scenarioStates[scenarioIndex] === 'correct'}
                      onClick={() => handleSelectOption(scenarioIndex, optionIndex)}
                    >
                      <span className="voss-quiz-option-arrow">▶</span>
                      <span>{option.text}</span>
                    </button>
                  ))}
                </div>

                {feedbackByScenario[scenarioIndex] && (
                  <div className={`voss-quiz-feedback ${scenarioStates[scenarioIndex] === 'correct' ? 'correct' : 'wrong'}`}>
                    {feedbackByScenario[scenarioIndex]}
                  </div>
                )}

                {scenarioStates[scenarioIndex] === 'correct' && (
                  <div className="voss-quiz-inline-message">VOSS-AI: {messagesByScenario[scenarioIndex]}</div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="voss-quiz-complete">
            <div className="voss-quiz-complete-icon">⌘</div>
            <h3>Fragmento desbloqueado</h3>
            <p>Has completado la evaluacion con la secuencia exacta del algoritmo VOSS.</p>
            <div className="voss-quiz-final-stats">
              <span>Puntaje final: <strong>{score}</strong></span>
              <span>Intentos fallidos: <strong>{totalFailures}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VossQuiz
