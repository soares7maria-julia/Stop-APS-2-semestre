import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Screen, Card, Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { joinRoomByCode } from '../services/roomService'
import { traduzirErroSala } from '../lib/roomErrors'

// Link de convite (/entrar/ABC123): entra na sala e abre o lobby.
// Quem ainda não tem sessão passa antes pela tela de convidado.
export function InvitePage() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const startedRef = useRef(false)

  useEffect(() => {
    if (!user || startedRef.current) return
    startedRef.current = true
    joinRoomByCode(code, user)
      .then(room => navigate('/jogo', { replace: true, state: { room } }))
      .catch(err => { console.error(err); setError(traduzirErroSala(err)) })
  }, [user, code, navigate])

  if (!user) return <Navigate to="/convidado" replace state={{ next: `/entrar/${code}` }} />

  return (
    <Screen>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-4">
          {error ? (<>
            <div className="text-4xl">😕</div>
            <p className="font-700 text-[var(--foreground)]">{error}</p>
            <Button onClick={() => navigate('/')}>Voltar ao menu</Button>
          </>) : (<>
            <div className="w-8 h-8 mx-auto rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"/>
            <p className="font-700 text-[var(--foreground)]">Entrando na sala {code.toUpperCase()}...</p>
          </>)}
        </Card>
      </div>
    </Screen>
  )
}