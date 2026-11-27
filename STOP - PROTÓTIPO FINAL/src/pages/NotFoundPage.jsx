// Mostra uma tela para endereços que não correspondem a nenhuma rota da aplicação.
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, Button, StopSign } from '../components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 text-center">
        <StopSign className="w-24 h-24 shadow-xl shadow-[var(--danger)]/30" textClassName="text-2xl"/>
        <div>
          <h1 className="text-5xl text-[var(--primary)]">404</h1>
          <p className="text-[var(--muted-foreground)] font-500 mt-2">Página não encontrada. Esse endereço não existe.</p>
        </div>
        <Button size="lg" onClick={() => navigate('/')}>🏠 Voltar ao menu</Button>
      </div>
    </Screen>
  )
}