// Valida o nome e o avatar e inicia uma sessão de convidado antes de jogar.
import React, { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input, AvatarPicker, AVATARS } from '../components/ui'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { guestSchema, validate } from '../lib/schemas'
import { traduzirErro } from '../lib/authErrors'

export function GuestPage() {
  const { loginAsGuest, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const next = location.state?.next ?? '/'
  const start = location.state?.start
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  // Quem já tem sessão (conta ou convidado) não precisa passar por aqui
  if (user) return <Navigate to={next} replace state={start ? { start } : undefined} />

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const result = validate(guestSchema, { username })
    setErrors(result.errors)
    if (!result.data) return
    setLoading(true)
    try {
      await loginAsGuest({ username: result.data.username, avatar })
      navigate(next, { replace: true, state: start ? { start } : undefined })
    } catch (err) {
      setFormError(traduzirErro(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {formError && <p className="text-sm text-[var(--danger)] text-center mb-3">{formError}</p>}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input label="Nome de usuário" placeholder="Como você quer ser chamado?" value={username}
          onChange={e => { setUsername(e.target.value); setErrors({}) }} error={errors.username}/>
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)] font-600 text-center">Escolha seu avatar</p>
          <div className="flex justify-center text-5xl">{avatar}</div>
          <AvatarPicker value={avatar} onChange={setAvatar}/>
        </div>
        <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
          {loading ? 'Entrando...' : '🎲 Jogar como Convidado'}
        </Button>
        <p className="text-xs text-[var(--muted-foreground)] text-center">
          Convidados jogam normalmente, mas só quem tem conta registra pontuação no ranking.
        </p>
      </form>
    </AuthLayout>
  )
}