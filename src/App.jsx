import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Portfolio from './pages/Portfolio.jsx'
import WalletApp from './wallet/WalletApp.jsx'

const App = () => (
  <Routes>
    <Route path="/" element={<Portfolio />} />
    <Route path="/wallet" element={<WalletApp />} />
  </Routes>
)

export default App
