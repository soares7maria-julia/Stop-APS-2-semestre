// Apresenta o cadastro de conta, valida os dados e registra uma pontuação pendente após autenticar.
import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Input, AvatarPicker, AVATARS } from '../components/ui'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { registerSchema, validate } from '../lib/schemas'
import { traduzirErro } from '../lib/authErrors'

export function RegisterPage() {
  const { register, isAuthenticated, pendingScore } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [values, setValues] = useState({ username: '', email: '', password: '' })
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  function setField(field, value) {
    setValues(v => ({ ...v, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  function handleNext(e) {
    e.preventDefault()
    setFormError('')
    const result = validate(registerSchema, values)
    setErrors(result.errors)
    if (result.data) setStep('avatar')
  }

  async function handleRegister() {
    setFormError('')
    const result = validate(registerSchema, values)
    if (!result.data) {
      setErrors(result.errors)
      setStep('form')
      return
    }
    setLoading(true)
    try {
      const { session } = await register({ ...result.data, avatar })
      if (!session) {
        setFormError('Conta criada, mas o login não foi feito. Confira se "Confirm email" está desligado no Supabase.')
        return
      }
      navigate(pendingScore ? '/ranking' : '/', { replace: true })
    } catch (err) {
      setFormError(traduzirErro(err))
    } finally {
      setLoading(false)
    }
  }

  if (step === 'avatar') {
    return (
      <AuthLayout showTabs={false}>
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl text-[var(--foreground)] mb-1">Escolha seu avatar</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Como os outros jogadores vão te ver</p>
          </div>
          <div className="flex justify-center text-6xl mb-2">{avatar}</div>
          <AvatarPicker value={avatar} onChange={setAvatar}/>
          {formError && <p className="text-sm text-[var(--danger)] text-center">{formError}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep('form')}>← Voltar</Button>
            <Button size="lg" className="flex-1" onClick={handleRegister} disabled={loading}>
              {loading ? 'Criando...' : 'Entrar 🎮'}
            </Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      {pendingScore && (
        <p className="text-sm text-[var(--success)] text-center mb-3 font-600">
          Crie sua conta para registrar sua pontuação de {pendingScore.points} pts.
        </p>
      )}
      <form onSubmit={handleNext} noValidate className="space-y-4">
        <Input label="Nome de usuário" placeholder="Como você quer ser chamado?" value={values.username}
          onChange={e => setField('username', e.target.value)} error={errors.username}/>
        <Input label="E-mail" type="email" placeholder="seu@email.com" value={values.email}
          onChange={e => setField('email', e.target.value)} error={errors.email}/>
        <Input label="Senha" type="password" placeholder="Crie uma senha segura" value={values.password}
          onChange={e => setField('password', e.target.value)} error={errors.password}/>
        <Button type="submit" size="lg" className="w-full mt-2">✨ Próximo</Button>
      </form>
    </AuthLayout>
  )
}