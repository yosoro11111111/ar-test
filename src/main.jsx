import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import { MMDStudio } from './components/mmd/MMDStudio'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MMDStudio />} />
        <Route path="/mmd" element={<MMDStudio />} />
        <Route path="/studio" element={<MMDStudio />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
