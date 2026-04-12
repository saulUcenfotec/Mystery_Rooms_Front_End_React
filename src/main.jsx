import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Avoid double-mounting heavy Three.js scenes during development.
createRoot(document.getElementById('root')).render(<App />)
