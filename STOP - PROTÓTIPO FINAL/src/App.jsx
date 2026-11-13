import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { MenuPage } from './pages/MenuPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { GuestPage } from './pages/GuestPage'
import { GamePage } from './pages/GamePage'
import { InvitePage } from './pages/InvitePage'
import { RankingPage } from './pages/RankingPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  const { loading } = useAuth()
  const [darkMode, setDarkMode] = useState(false)
  const [soundOn, setSoundOn] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Espera a sessão ser lida para a tela de login não "piscar" ao atualizar a página
  if (loading) return null

  return (
    <Routes>
      <Route path="/" element={<MenuPage darkMode={darkMode} soundOn={soundOn} onToggleDark={() => setDarkMode(d => !d)} onToggleSound={() => setSoundOn(s => !s)}/>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/cadastro" element={<RegisterPage/>}/>
      <Route path="/convidado" element={<GuestPage/>}/>
      <Route path="/jogo" element={<GamePage/>}/>
      <Route path="/entrar/:code" element={<InvitePage/>}/>
      <Route path="/ranking" element={<RankingPage/>}/>
      <Route path="/perfil" element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
      <Route path="*" element={<NotFoundPage/>}/>
    </Routes>
  )
}