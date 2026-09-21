import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/perf' // sets html.lite before the first paint
import './styles/global.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Drop the inlined boot splash once React has painted.
requestAnimationFrame(() => {
  const boot = document.getElementById('boot')
  if (!boot) return
  boot.style.opacity = '0'
  setTimeout(() => boot.remove(), 420)
})
