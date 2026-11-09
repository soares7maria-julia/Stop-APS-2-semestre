import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AVATARS } from '../components/ui'
import {
  getSession, onAuthChange, signIn, signUp, signInGuest, signOut,
  updateProfile as saveProfile,
} from '../services/authService'
import { submitScore } from '../services/gameService'

const AuthContext = createContext(null)

// Formato único de usuário para o app inteiro: { id, name, avatar, isGuest }
function toUser(session) {
  const u = session.user
  return {
    id: u.id,
    name: u.user_metadata?.username || (u.email ? u.email.split('@')[0] : 'Convidado'),
    avatar: u.user_metadata?.avatar || AVATARS[0],
    isGuest: !!u.is_anonymous,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Pontuação de quem terminou a partida sem conta. Fica só em memória (nada de localStorage):
  // dura enquanto a pessoa vai para o login/cadastro e é enviada ao banco logo depois.
  const [pendingScore, setPendingScore] = useState(null)
  // Resultado do último envio feito depois do login (para avisar na tela de ranking)
  const [lastSavedScore, setLastSavedScore] = useState(null)
  const sendingRef = useRef(null)

  useEffect(() => {
    getSession()
      .then(session => setUser(session ? toUser(session) : null))
      .catch(console.error)
      .finally(() => setLoading(false))
    return onAuthChange(session => setUser(session ? toUser(session) : null))
  }, [])

  // Quando existe pontuação pendente e a pessoa passa a ter conta, envia ao Supabase
  useEffect(() => {
    if (!pendingScore || !user || user.isGuest) return
    if (sendingRef.current === pendingScore) return // evita envio duplicado
    sendingRef.current = pendingScore
    submitScore(pendingScore)
      .then(stats => {
        setLastSavedScore({ points: pendingScore.points, stats })
        setPendingScore(null)
      })
      .catch(err => {
        console.error(err)
        sendingRef.current = null
      })
  }, [user, pendingScore])

  const value = {
    user,
    loading,
    isGuest: !!user?.isGuest,
    isAuthenticated: !!user && !user.isGuest, // conta real
    pendingScore,
    setPendingScore,
    lastSavedScore,
    clearLastSaved: () => setLastSavedScore(null),
    login: signIn,
    register: signUp,
    loginAsGuest: signInGuest,
    logout: signOut,
    updateProfile: ({ username, avatar }) => saveProfile({ userId: user.id, username, avatar }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}