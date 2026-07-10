// ---------------------------------------------------------------
// Phase 4 update: BrowserRouter wraps the app so any component
// inside can read and change the URL. React Router intercepts
// link clicks and swaps components — no full page reload.
// ---------------------------------------------------------------
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
