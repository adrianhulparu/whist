import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Prevent double-tap zoom
let lastTouchEnd = 0
document.addEventListener('touchend', (event) => {
  const now = Date.now()
  if (now - lastTouchEnd <= 300) {
    event.preventDefault()
  }
  lastTouchEnd = now
}, false)

// Prevent pinch zoom
document.addEventListener('gesturestart', (e) => {
  e.preventDefault()
})

document.addEventListener('gesturechange', (e) => {
  e.preventDefault()
})

document.addEventListener('gestureend', (e) => {
  e.preventDefault()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

