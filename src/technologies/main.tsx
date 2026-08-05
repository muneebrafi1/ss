import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles.css'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { TechnologiesApp } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <TechnologiesApp />
    </ErrorBoundary>
  </StrictMode>,
)
