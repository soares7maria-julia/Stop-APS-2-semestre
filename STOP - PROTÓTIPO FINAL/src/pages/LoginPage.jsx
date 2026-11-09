import React, { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input, Divider } from '../components/ui'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { loginSchema, validate } from '../lib/schemas'
import { traduzirErro } from '../lib/authErrors'

export function LoginPage() {
  const { login, isAuthenticated, pendingScore } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  function setField(field, value) {
    setValues(v => ({ ...v, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const result = validate(loginSchema, values)
    setErrors(result.errors)
    if (!result.data) return
    setLoading(true)
    try {
      await login(result.data)
      // Com pontuação pendente, vai ao ranking: ela é enviada assim que a sessão entra
      navigate(pendingScore ? '/ranking' : (location.state?.from ?? '/'), { replace: true })
    } catch (err) {
      setFormError(traduzirErro(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {pendingScore && (
        <p className="text-sm text-[var(--success)] text-center mb-3 font-600">
          Entre para registrar sua pontuação de {pendingScore.points} pts.
        </p>
      )}
      {formError && <p className="text-sm text-[var(--danger)] text-center mb-3">{formError}</p>}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input label="E-mail" type="email" placeholder="seu@email.com" value={values.email}
          onChange={e => setField('email', e.target.value)} error={errors.email}/>
        <Input label="Senha" type="password" placeholder="Sua senha" value={values.password}
          onChange={e => setField('password', e.target.value)} error={errors.password}/>
        <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
          {loading ? 'Entrando...' : '🎮 Entrar'}
        </Button>
      </form>
      <div className="mt-4 space-y-4">
        <Divider label="ou"/>
        <Button variant="secondary" size="md" className="w-full" onClick={() => navigate('/convidado')}>
          🎲 Jogar sem conta
        </Button>
      </div>
    </AuthLayout>
  )
}