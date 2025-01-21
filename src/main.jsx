import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import animate from '../script.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <animate />
  </StrictMode>,
)
