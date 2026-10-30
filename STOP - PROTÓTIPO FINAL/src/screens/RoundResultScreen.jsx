import React, { useEffect } from 'react';
import { Screen, TopBar, Card, Button } from '../components/ui';
import { useToast, ToastContainer } from '../components/ui';
import { MOCK_ROUND_RESULTS } from '../gameState';
export function RoundResultScreen({ currentRound, totalRounds, letter, categories, isLastRound, onBack, onNext }) {
    const { toasts, add: addToast, remove: removeToast } = useToast();
    useEffect(() => {
        const timers = [
            setTimeout(() => addToast('✅ "Baleia" foi aceita por todos!', 'success'), 500),
            setTimeout(() => addToast('⚠️ "Beatriz" vale 5pts (resposta repetida)', 'warning'), 1500),
            setTimeout(() => addToast('🏆 Nova conquista pessoal de pontuação!', 'success'), 2800),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);
    const youResult = {
        ...MOCK_ROUND_RESULTS[0],
        roundScore: categories.reduce((total, category) => total + (MOCK_ROUND_RESULTS[0].categories[category] ?? 10), 0),
        categories: Object.fromEntries(categories.map(category => [category, MOCK_ROUND_RESULTS[0].categories[category] ?? 10]))
    };
    const roomResults = MOCK_ROUND_RESULTS.map(player => ({
        ...player,
        totalScore: player.totalScore * currentRound
    }));
    return (<Screen>
      <TopBar title={`Resultado — Rodada ${currentRound}/${totalRounds}`} subtitle={`Letra: ${letter}`} onBack={onBack}/>
      <div className="flex-1 p-4 space-y-4 max-w-2xl mx-auto w-full pb-8">

        {/* Your round summary */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{youResult.avatar}</span>
            <div>
              <div className="font-700 text-[var(--foreground)]">Sua pontuação nesta rodada</div>
              <div className="text-3xl font-700 text-[var(--primary)]">+{youResult.roundScore} pts</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(youResult.categories).map(([cat, pts]) => (<div key={cat} className={`rounded-xl p-2.5 text-center border ${pts > 0 ? 'border-[var(--success)]/30 bg-[var(--success)]/5' : 'border-[var(--border)] bg-[var(--muted)]'}`}>
                <div className="text-xs text-[var(--muted-foreground)] font-600">{cat}</div>
                <div className={`font-700 text-lg ${pts > 0 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}`}>{pts > 0 ? `+${pts}` : '—'}</div>
              </div>))}
          </div>
        </Card>

        {/* Leaderboard */}
        <Card className="p-5">
          <h2 className="text-xl text-[var(--foreground)] mb-4">🏆 Placar Geral</h2>
          <div className="space-y-2">
            {roomResults
            .sort((a, b) => b.totalScore - a.totalScore)
            .map((p, i) => (<div key={p.playerId} className={`flex items-center gap-3 p-3 rounded-2xl ${p.playerId === 'you' ? 'bg-[var(--primary)]/10 border border-[var(--primary)]' : 'bg-[var(--muted)]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-700 text-sm flex-shrink-0 ${i === 0 ? 'bg-[var(--warning)] text-white' :
                i === 1 ? 'bg-gray-300 text-gray-700' :
                    i === 2 ? 'bg-amber-600 text-white' :
                        'bg-[var(--muted-foreground)]/20 text-[var(--muted-foreground)]'}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                  <span className="text-xl">{p.avatar}</span>
                  <div className="flex-1">
                    <div className="font-700 text-[var(--card-foreground)]">{p.name} {p.playerId === 'you' && <span className="text-xs text-[var(--primary)]">(você)</span>}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">+{p.roundScore} nesta rodada</div>
                  </div>
                  <div className="font-700 text-xl text-[var(--primary)]">{p.totalScore}</div>
                </div>))}
          </div>
        </Card>

        <Button size="xl" className="w-full" onClick={onNext}>
          {isLastRound ? '🏁 Ver Resultado Final' : `▶ Próxima Rodada (${currentRound + 1}/${totalRounds})`}
        </Button>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </Screen>);
}
