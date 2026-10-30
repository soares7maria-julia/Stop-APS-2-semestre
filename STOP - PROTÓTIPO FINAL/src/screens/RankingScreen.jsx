import React, { useState } from 'react';
import { Screen, TopBar, Card } from '../components/ui';
import { MOCK_RANKING_GLOBAL, MOCK_MY_SCORES } from '../gameState';
export function RankingScreen({ onBack, isGuest = false }) {
    const [tab, setTab] = useState('global');
    return (<Screen>
      <TopBar title="🏆 Ranking" onBack={onBack}/>
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-8">

        {/* Tabs */}
        <div className="flex bg-[var(--muted)] rounded-2xl p-1">
          {['global', ...(!isGuest ? ['mine'] : [])].map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl font-700 text-sm cursor-pointer border-0 transition-all ${tab === t ? 'bg-[var(--card)] text-[var(--primary)] shadow-md' : 'text-[var(--muted-foreground)] bg-transparent'}`}>
              {t === 'global' ? '🌎 Global' : '📊 Minhas Pontuações'}
            </button>))}
        </div>

        {tab === 'global' ? (<Card className="p-4">
            <div className="space-y-2">
              {MOCK_RANKING_GLOBAL.filter(entry => !isGuest || !entry.isYou).map(entry => (<div key={entry.rank} className={`flex items-center gap-3 p-3 rounded-2xl ${entry.isYou ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]' : entry.rank <= 3 ? 'bg-[var(--muted)]' : 'bg-[var(--muted)]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-700 text-sm flex-shrink-0 ${entry.rank === 1 ? 'bg-[var(--warning)] text-white' :
                    entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                        entry.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-[var(--secondary)] text-[var(--secondary-foreground)]'}`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </div>
                  <span className="text-2xl">{entry.avatar}</span>
                  <div className="flex-1">
                    <div className="font-700 text-[var(--card-foreground)]">
                      {entry.name} {entry.isYou && <span className="text-xs text-[var(--primary)]">(você)</span>}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">{entry.date}</div>
                  </div>
                  <div className="font-700 text-xl text-[var(--primary)]">{entry.score.toLocaleString('pt-BR')}</div>
                </div>))}
            </div>
          </Card>) : (<div className="space-y-3">
            <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-700 text-[var(--foreground)]">Melhor pontuação</div>
                  <div className="text-[var(--muted-foreground)] text-sm">Total de {MOCK_MY_SCORES.length} partidas registradas</div>
                </div>
                <div className="text-3xl font-700 text-[var(--primary)]">385</div>
              </div>
            </div>
            <Card className="p-4">
              <div className="space-y-2">
                {MOCK_MY_SCORES.map((entry, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--muted)]">
                    <span className="text-2xl">{entry.avatar}</span>
                    <div className="flex-1">
                      <div className="font-700 text-[var(--card-foreground)]">{entry.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{entry.date} • {entry.players} jogadores • {entry.rounds} rodadas</div>
                    </div>
                    <div className="font-700 text-xl text-[var(--primary)]">{entry.score}</div>
                  </div>))}
              </div>
            </Card>
          </div>)}
      </div>
    </Screen>);
}
