// Carrega estatísticas e histórico da conta e permite editar os dados públicos do perfil.
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfileScreen } from '../screens/ProfileScreen'
import { useAuth } from '../context/AuthContext'
import { getMyStats, getMyHistory } from '../services/gameService'

// Área protegida (ver ProtectedRoute em App.jsx): só conta real chega aqui
export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getMyStats(user.id), getMyHistory(user.id)])
      .then(([s, h]) => { if (active) { setStats(s); setHistory(h) } })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id])

  return (
    <ProfileScreen
      user={user}
      stats={stats}
      history={history}
      loading={loading}
      onSave={updateProfile}
      onBack={() => navigate('/')}
    />
  )
}