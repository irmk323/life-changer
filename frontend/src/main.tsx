import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppStateProvider } from './app/AppStateProvider.tsx'
import { AuthProvider } from './app/AuthProvider.tsx'
import { AppAuthGate } from './app/AppAuthGate.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <AuthProvider><AppAuthGate><AppStateProvider><App /></AppStateProvider></AppAuthGate></AuthProvider>
  </StrictMode>,
)
