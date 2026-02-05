import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import { ARDirectorHome } from './components/ar/ARDirectorHome.jsx'
import { ARSceneSelector } from './components/ar/ARSceneSelector.jsx'
import { ARSceneCapture } from './components/ar/ARSceneCapture.jsx'
import { ARTimelineEditorPage } from './components/ar/ARTimelineEditorPage.jsx'
import { ARExportPage } from './components/ar/ARExportPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ar-director" element={<ARDirectorHome />} />
        <Route path="/ar-director/selector" element={<ARSceneSelector />} />
        <Route path="/ar-director/capture" element={<ARSceneCapture />} />
        <Route path="/ar-director/edit/:projectId" element={<ARTimelineEditorPage />} />
        <Route path="/ar-director/edit/new" element={<ARTimelineEditorPage />} />
        <Route path="/ar-director/export/:projectId" element={<ARExportPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
