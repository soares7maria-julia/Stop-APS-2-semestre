// Liga o menu principal aos dados do usuário e encaminha cada ação para a rota correspondente.
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MenuScreen } from '../screens/MenuScreen'
import { useAuth } from '../context/AuthContext'
import { getMyStats } from '../services/gameService'

export function MenuPage({ darkMode, soundOn, onToggleDark, onToggleSound }) {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) { setStats(null); return }
    let active = true
    getMyStats(user.id).then(s => { if (active) setStats(s) }).catch(console.error)
    return () => { active = false }
  }, [isAuthenticated, user?.id])

  async function handleLogout() {
    try { await logout() } catch (err) { console.error(err) }
    navigate('/')
  }

  // Sem sessão, a pessoa passa pela tela de convidado antes de entrar no jogo
  function goPlay(start) {
    if (!user) navigate('/convidado', { state: { next: '/jogo', start } })
    else navigate('/jogo', { state: { start } })
  }

  return (
    <MenuScreen
      user={user}
      stats={stats}
      darkMode={darkMode}
      soundOn={soundOn}
      onToggleDark={onToggleDark}
      onToggleSound={onToggleSound}
      onLogout={handleLogout}
      onLogin={() => navigate('/login')}
      onRegister={() => navigate('/cadastro')}
      onJoin={() => goPlay('join-room')}
      onCreate={() => goPlay('create-room')}
      onRanking={() => navigate('/ranking')}
      onProfile={() => navigate(isAuthenticated ? '/perfil' : '/cadastro')}
    />
  )
}