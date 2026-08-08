import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppStateProvider } from './app/AppStateProvider.tsx'
import { AuthProvider } from './app/AuthProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <AuthProvider><AppStateProvider><App /></AppStateProvider></AuthProvider>
  </StrictMode>,
)
