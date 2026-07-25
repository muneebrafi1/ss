import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles.css'
import { WelcomeApp } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WelcomeApp />
  </StrictMode>,
)
