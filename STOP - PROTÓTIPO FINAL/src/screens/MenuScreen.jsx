import React, { useState } from 'react';
import { Button, Modal, Card, StopSign } from '../components/ui';
import { Screen } from '../components/ui';
export function MenuScreen({ user, darkMode, soundOn, onToggleDark, onToggleSound, onBack, onJoin, onCreate, onRanking, onProfile }) {
    const [instrOpen, setInstrOpen] = useState(false);
    return (<Screen>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] flex items-center justify-center cursor-pointer border-0 text-[var(--foreground)] font-700 flex-shrink-0" aria-label="Voltar">
            ←
          </button>
          <button onClick={onProfile} className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-3 py-2 cursor-pointer hover:border-[var(--primary)] transition-all">
            <span className="text-2xl">{user.avatar}</span>
            <div className="text-left">
              <div className="text-xs text-[var(--muted-foreground)] font-600">Bem-vindo,</div>
              <div className="font-700 text-[var(--foreground)] text-sm leading-tight">{user.name}</div>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleSound} className="w-10 h-10 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-all text-lg" title={soundOn ? 'Desligar som' : 'Ligar som'}>
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button onClick={onToggleDark} className="w-10 h-10 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-all text-lg" title={darkMode ? 'Modo claro' : 'Modo escuro'}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">
        {/* Logo */}
        <div className="text-center">
          <div className="relative inline-block">
            <StopSign className="w-28 h-28 shadow-2xl shadow-[var(--danger)]/40 animate-pulse-ring mx-auto" textClassName="text-3xl"/>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white text-xs font-700 shadow-lg">✨</div>
          </div>
          <h1 className="text-6xl text-[var(--primary)] mt-4 drop-shadow">Stop!</h1>
          <p className="text-[var(--muted-foreground)] font-500 mt-1">Adedonha multiplayer em tempo real</p>
        </div>

        {/* Main actions */}
        <div className="w-full max-w-xs space-y-3">
          <Button size="xl" className="w-full text-2xl py-5" onClick={onJoin}>
            🎮 Jogar
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={onCreate}>
            🏠 Criar Sala
          </Button>
        </div>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <Card className="p-4 text-center cursor-pointer hover:border-[var(--primary)] transition-all" onClick={onRanking}>
            <div className="text-3xl mb-1">🏆</div>
            <div className="font-700 text-sm text-[var(--foreground)]">Ranking</div>
          </Card>
          <Card className="p-4 text-center cursor-pointer hover:border-[var(--primary)] transition-all" onClick={() => setInstrOpen(true)}>
            <div className="text-3xl mb-1">📖</div>
            <div className="font-700 text-sm text-[var(--foreground)]">Instruções</div>
          </Card>
        </div>

        {/* Stats strip */}
        {!user.isGuest && (<div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-700 text-[var(--primary)]">47</div>
            <div className="text-xs text-[var(--muted-foreground)] font-600">Partidas</div>
          </div>
          <div className="w-px bg-[var(--border)]"/>
          <div>
            <div className="text-2xl font-700 text-[var(--accent)]">3.850</div>
            <div className="text-xs text-[var(--muted-foreground)] font-600">Pontos</div>
          </div>
          <div className="w-px bg-[var(--border)]"/>
          <div>
            <div className="text-2xl font-700 text-[var(--success)]">12</div>
            <div className="text-xs text-[var(--muted-foreground)] font-600">Vitórias</div>
          </div>
        </div>)}
      </div>

      {/* Instructions Modal */}
      <Modal open={instrOpen} onClose={() => setInstrOpen(false)} title="📖 Como Jogar" size="md">
        <div className="space-y-4 text-[var(--card-foreground)]">
          <Step n={1} title="Uma letra é sorteada" desc="Cada rodada começa com uma letra aleatória. Ela nunca se repete na mesma partida!"/>
          <Step n={2} title="Preencha as categorias" desc="Escreva uma palavra começando com a letra sorteada para cada categoria. Ex.: letra B, Animal → Baleia."/>
          <Step n={3} title="Pressione STOP!" desc='Quando terminar, clique em "STOP!" para encerrar a rodada para todos os jogadores.'/>
          <Step n={4} title="Votação" desc="Respostas repetidas valem 5 pontos. Respostas únicas valem 10 pontos. Você pode contestar palavras duvidosas!"/>
          <Step n={5} title="Vença!" desc="Após todas as rodadas, quem tiver mais pontos ganha. Boa sorte! 🎉"/>
          <div className="bg-[var(--muted)] rounded-2xl p-4 mt-2">
            <p className="font-700 text-sm text-[var(--foreground)] mb-2">💡 Pontuação</p>
            <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
              <div className="flex justify-between"><span>Resposta única e válida</span><span className="font-700 text-[var(--success)]">10 pts</span></div>
              <div className="flex justify-between"><span>Resposta repetida e válida</span><span className="font-700 text-[var(--warning)]">5 pts</span></div>
              <div className="flex justify-between"><span>Campo em branco ou inválido</span><span className="font-700 text-[var(--danger)]">0 pts</span></div>
            </div>
          </div>
        </div>
      </Modal>
    </Screen>);
}
function Step({ n, title, desc }) {
    return (<div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-700 flex-shrink-0 text-sm">{n}</div>
      <div>
        <div className="font-700 text-[var(--card-foreground)]">{title}</div>
        <div className="text-sm text-[var(--muted-foreground)] mt-0.5">{desc}</div>
      </div>
    </div>);
}
