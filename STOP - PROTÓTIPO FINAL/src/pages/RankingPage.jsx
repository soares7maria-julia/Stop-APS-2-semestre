import React from 'react'
import { useNavigate } from 'react-router-dom'
import { RankingScreen } from '../screens/RankingScreen'
import { useAuth } from '../context/AuthContext'

// Página pública: qualquer pessoa pode consultar o ranking
export function RankingPage() {
  const { user, isAuthenticated, lastSavedScore, clearLastSaved } = useAuth()
  const navigate = useNavigate()
  return (
    <RankingScreen
      user={user}
      isAuthenticated={isAuthenticated}
      savedNotice={lastSavedScore}
      onDismissNotice={clearLastSaved}
      onLogin={() => navigate('/login')}
      onBack={() => navigate('/')}
    />
  )
}