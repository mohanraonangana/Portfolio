import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Portfolio from './pages/Portfolio.jsx'
import WalletApp from './wallet/WalletApp.jsx'

const App = () => (
  <Routes>
    <Route path="/" element={<Portfolio />} />
    <Route path="/wallet" element={<WalletApp />} />
    {/* unknown paths (e.g. /work, /about) go home instead of rendering a blank page */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default App
