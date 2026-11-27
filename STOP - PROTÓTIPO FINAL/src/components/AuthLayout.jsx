// Monta a estrutura visual compartilhada pelas páginas de login, cadastro e entrada como convidado.
import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Card, StopSign } from './ui'

const TABS = [
  { to: '/login', label: 'Entrar' },
  { to: '/cadastro', label: 'Criar Conta' },
  { to: '/convidado', label: 'Convidado' },
]

// Mesmo visual da antiga AuthScreen: fundo, logo, card e abas (agora são links de rota)
export function AuthLayout({ children, showTabs = true }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--accent)]/20 rounded-full blur-3xl"/>
      </div>

      <Card className="w-full max-w-md p-8 relative animate-fade-in">
        <div className="text-center mb-8">
          <StopSign className="w-20 h-20 mb-4 mx-auto shadow-xl shadow-[var(--danger)]/30 animate-pulse-ring" textClassName="text-xl"/>
          <h1 className="text-4xl text-[var(--primary)]">Stop!</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1 font-500">O jogo de palavras mais divertido</p>
        </div>

        {showTabs && (
          <div className="flex bg-[var(--muted)] rounded-2xl p-1 mb-6">
            {TABS.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  `flex-1 py-2 rounded-xl text-sm font-700 text-center no-underline transition-all ${
                    isActive ? 'bg-[var(--card)] text-[var(--primary)] shadow-md' : 'text-[var(--muted-foreground)] bg-transparent'
                  }`}
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        )}

        {children}

        <Link to="/" className="block text-center text-sm text-[var(--muted-foreground)] mt-6 no-underline hover:text-[var(--primary)]">
          ← Voltar ao menu
        </Link>
      </Card>
    </div>
  )
}