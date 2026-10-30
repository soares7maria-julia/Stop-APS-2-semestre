import React, { useEffect, useState } from 'react';
import { Screen, Card, Button, Modal, ToastContainer, useToast } from '../components/ui';
import { MOCK_GAME_OVER } from '../gameState';
function Confetti() {
    const PIECES = Array.from({ length: 24 }, (_, i) => i);
    const colors = ['var(--primary)', 'var(--accent)', 'var(--success)', 'var(--warning)'];
    return (<div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {PIECES.map(i => (<div key={i} className="absolute w-3 h-3 rounded-sm" style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}px`,
                backgroundColor: colors[i % colors.length],
                animation: `confetti-fall ${1.5 + Math.random() * 2}s ${Math.random() * 2}s ease-in forwards`,
                transform: `rotate(${Math.random() * 360}deg)`,
            }}/>))}
    </div>);
}
export function GameOverScreen({ isOwner, onBack, onNewGame, onMenu }) {
    const sorted = [...MOCK_GAME_OVER].sort((a, b) => b.score - a.score);
    const [achievementOpen, setAchievementOpen] = useState(false);
    const { toasts, add: addToast, remove: removeToast } = useToast();
    const [first, second, third, ...rest] = sorted;
    const savedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
    useEffect(() => {
        const notice = setTimeout(() => {
            addToast('Nova conquista pessoal!', 'success');
            setAchievementOpen(true);
        }, 900);
        return () => clearTimeout(notice);
    }, []);
    return (<Screen>
      <Confetti />
      <button onClick={onBack} className="fixed top-4 left-4 z-30 w-9 h-9 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] flex items-center justify-center cursor-pointer border-0 text-[var(--foreground)] font-700" aria-label="Voltar">
        ←
      </button>
      <div className="flex-1 flex flex-col items-center p-4 pt-8 gap-6 max-w-lg mx-auto w-full pb-8 relative z-20">

        {/* Title */}
        <div className="text-center">
          <div className="text-6xl mb-2">🏆</div>
          <h1 className="text-5xl text-[var(--primary)]">Fim de Jogo!</h1>
          <p className="text-[var(--muted-foreground)] font-500 mt-1">Parabéns a todos os jogadores!</p>
        </div>

        {/* Podium */}
        <div className="w-full">
          <div className="flex items-end justify-center gap-3">
            {/* 2nd */}
            {second && (<div className="flex flex-col items-center gap-2">
                <div className="text-3xl">{second.avatar}</div>
                <div className="font-700 text-sm text-[var(--foreground)] text-center">{second.name.split(' ')[0]}</div>
                <div className="font-700 text-[var(--muted-foreground)]">{second.score}</div>
                <div className="w-24 bg-gray-300 dark:bg-gray-600 rounded-t-2xl flex items-center justify-center text-3xl font-700 text-gray-700" style={{ height: '80px' }}>🥈</div>
              </div>)}
            {/* 1st */}
            {first && (<div className="flex flex-col items-center gap-2">
                <div className="text-4xl animate-bounce">{first.avatar}</div>
                <div className="font-700 text-[var(--foreground)] text-center">{first.name.split(' ')[0]}</div>
                <div className="font-700 text-[var(--primary)] text-lg">{first.score}</div>
                <div className="w-28 bg-gradient-to-b from-[var(--warning)] to-yellow-600 rounded-t-2xl flex items-center justify-center text-3xl" style={{ height: '110px' }}>🥇</div>
              </div>)}
            {/* 3rd */}
            {third && (<div className="flex flex-col items-center gap-2">
                <div className="text-3xl">{third.avatar}</div>
                <div className="font-700 text-sm text-[var(--foreground)] text-center">{third.name.split(' ')[0]}</div>
                <div className="font-700 text-[var(--muted-foreground)]">{third.score}</div>
                <div className="w-24 bg-amber-600 rounded-t-2xl flex items-center justify-center text-3xl" style={{ height: '60px' }}>🥉</div>
              </div>)}
          </div>
        </div>

        {/* Full ranking */}
        <Card className="w-full p-4">
          <h3 className="font-700 text-[var(--foreground)] mb-3">Classificação Final</h3>
          <div className="space-y-2">
            {sorted.map((p, i) => (<div key={p.playerId} className={`flex items-center gap-3 p-3 rounded-2xl ${p.playerId === 'you' ? 'bg-[var(--primary)]/10 border border-[var(--primary)]' : 'bg-[var(--muted)]'}`}>
                <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}</span>
                <span className="text-2xl">{p.avatar}</span>
                <div className="flex-1 font-700 text-[var(--card-foreground)]">{p.name}</div>
                <div className="font-700 text-xl text-[var(--primary)]">{p.score}</div>
              </div>))}
          </div>
        </Card>

        <div className="w-full rounded-2xl bg-[var(--success)]/10 border border-[var(--success)]/30 p-4 text-center">
          <p className="font-700 text-[var(--success)]">Partida salva na sua conta</p>
          <p className="text-sm text-[var(--muted-foreground)]">Pontuação e conquistas registradas em {savedAt}.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAchievementOpen(true)}>Ver conquistas desbloqueadas</Button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          {isOwner && (<Button size="xl" variant="accent" className="w-full" onClick={onNewGame}>
              Revanche
            </Button>)}
          <Button size="lg" variant="secondary" className="w-full" onClick={onMenu}>
            Voltar ao Menu
          </Button>
        </div>
      </div>
      <Modal open={achievementOpen} onClose={() => setAchievementOpen(false)} title="Nova conquista pessoal!" size="md">
        <div className="space-y-3">
          {[
              ['Primeira Vitória', 'Vença sua primeira partida'],
              ['Pontuação Perfeita em uma Rodada', 'Acerte todas as categorias'],
              ['10 Partidas Jogadas', 'Complete dez partidas'],
          ].map(([title, description]) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl bg-[var(--muted)] p-4">
                <div className="w-10 h-10 rounded-full bg-[var(--warning)]/20 text-[var(--warning)] flex items-center justify-center font-700">✓</div>
                <div>
                  <p className="font-700 text-[var(--foreground)]">{title}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
                </div>
              </div>
          ))}
          <Button className="w-full" onClick={() => setAchievementOpen(false)}>Continuar</Button>
        </div>
      </Modal>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </Screen>);
}
