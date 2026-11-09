import React, { useEffect, useState } from 'react';
import { Screen, TopBar, Card, Button } from '../components/ui';
import { getRanking, getMyStats, getMyHistory } from '../services/gameService';

const fmtDate = iso => new Intl.DateTimeFormat('pt-BR').format(new Date(iso));

export function RankingScreen({ user, isAuthenticated, savedNotice, onDismissNotice, onLogin, onBack }) {
    const [tab, setTab] = useState('global');
    const [ranking, setRanking] = useState([]);
    const [rankingState, setRankingState] = useState('loading'); // loading | ready | error
    const [mine, setMine] = useState({ stats: null, history: [] });

    // Recarrega quando uma pontuação pendente acabou de ser registrada (savedNotice muda)
    useEffect(() => {
        let active = true;
        setRankingState('loading');
        getRanking()
            .then(rows => { if (active) { setRanking(rows); setRankingState('ready'); } })
            .catch(err => { console.error(err); if (active) setRankingState('error'); });
        return () => { active = false; };
    }, [savedNotice]);

    useEffect(() => {
        if (!isAuthenticated || !user)
            return;
        let active = true;
        Promise.all([getMyStats(user.id), getMyHistory(user.id)])
            .then(([stats, history]) => { if (active) setMine({ stats, history }); })
            .catch(console.error);
        return () => { active = false; };
    }, [isAuthenticated, user?.id, savedNotice]);

    const tabs = ['global', ...(isAuthenticated ? ['mine'] : [])];

    return (<Screen>
      <TopBar title="🏆 Ranking" onBack={onBack}/>
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-8">

        {savedNotice && (<div className="rounded-2xl bg-[var(--success)]/10 border border-[var(--success)]/30 p-4 flex items-start gap-3">
            <div className="flex-1">
              <p className="font-700 text-[var(--success)]">Pontuação registrada!</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {savedNotice.points} pts nesta partida. Seu recorde: {savedNotice.stats.best_score} pts.
              </p>
            </div>
            <button onClick={onDismissNotice} className="cursor-pointer border-0 bg-transparent text-[var(--muted-foreground)]" aria-label="Fechar">✕</button>
          </div>)}

        {!isAuthenticated && (<div className="rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 p-4 flex items-center gap-3">
            <p className="flex-1 text-sm text-[var(--foreground)]">Entre com uma conta para registrar sua pontuação e aparecer no ranking.</p>
            <Button size="sm" onClick={onLogin}>Entrar</Button>
          </div>)}

        {/* Tabs */}
        <div className="flex bg-[var(--muted)] rounded-2xl p-1">
          {tabs.map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl font-700 text-sm cursor-pointer border-0 transition-all ${tab === t ? 'bg-[var(--card)] text-[var(--primary)] shadow-md' : 'text-[var(--muted-foreground)] bg-transparent'}`}>
              {t === 'global' ? '🌎 Global' : '📊 Minhas Pontuações'}
            </button>))}
        </div>

        {tab === 'global' ? (<Card className="p-4">
            {rankingState === 'loading' && (<p className="text-center text-sm text-[var(--muted-foreground)] py-6">Carregando ranking...</p>)}
            {rankingState === 'error' && (<p className="text-center text-sm text-[var(--danger)] py-6">Não foi possível carregar o ranking. Tente novamente em instantes.</p>)}
            {rankingState === 'ready' && ranking.length === 0 && (<p className="text-center text-sm text-[var(--muted-foreground)] py-6">
                Ninguém registrou pontuação ainda. Seja o primeiro a entrar no ranking!
              </p>)}
            {rankingState === 'ready' && ranking.length > 0 && (<div className="space-y-2">
                {ranking.map((entry, i) => {
                    const rank = i + 1;
                    const isYou = !!user && entry.user_id === user.id;
                    return (<div key={entry.user_id} className={`flex items-center gap-3 p-3 rounded-2xl ${isYou ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]' : 'bg-[var(--muted)]'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-700 text-sm flex-shrink-0 ${rank === 1 ? 'bg-[var(--warning)] text-white' :
                        rank === 2 ? 'bg-gray-300 text-gray-700' :
                            rank === 3 ? 'bg-amber-600 text-white' :
                                'bg-[var(--secondary)] text-[var(--secondary-foreground)]'}`}>
                        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
                      </div>
                      <span className="text-2xl">{entry.avatar}</span>
                      <div className="flex-1">
                        <div className="font-700 text-[var(--card-foreground)]">
                          {entry.display_name} {isYou && <span className="text-xs text-[var(--primary)]">(você)</span>}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">{entry.games_played} {entry.games_played === 1 ? 'partida' : 'partidas'} • {entry.wins} {entry.wins === 1 ? 'vitória' : 'vitórias'}</div>
                      </div>
                      <div className="font-700 text-xl text-[var(--primary)]">{entry.best_score.toLocaleString('pt-BR')}</div>
                    </div>);
                })}
              </div>)}
          </Card>) : (<div className="space-y-3">
            <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-700 text-[var(--foreground)]">Melhor pontuação</div>
                  <div className="text-[var(--muted-foreground)] text-sm">
                    {mine.stats ? `${mine.stats.games_played} ${mine.stats.games_played === 1 ? 'partida registrada' : 'partidas registradas'}` : 'Carregando...'}
                  </div>
                </div>
                <div className="text-3xl font-700 text-[var(--primary)]">{mine.stats ? mine.stats.best_score : '—'}</div>
              </div>
            </div>
            <Card className="p-4">
              {mine.history.length === 0 ? (<p className="text-center text-sm text-[var(--muted-foreground)] py-6">Você ainda não registrou nenhuma partida.</p>) : (<div className="space-y-2">
                  {mine.history.map(entry => (<div key={entry.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--muted)]">
                      <span className="text-2xl">{entry.won ? '🏆' : '🎮'}</span>
                      <div className="flex-1">
                        <div className="font-700 text-[var(--card-foreground)]">{entry.won ? 'Vitória' : 'Partida'}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{fmtDate(entry.played_at)} • {entry.players} {entry.players === 1 ? 'jogador' : 'jogadores'} • {entry.rounds} rodadas</div>
                      </div>
                      <div className="font-700 text-xl text-[var(--primary)]">{entry.points}</div>
                    </div>))}
                </div>)}
            </Card>
          </div>)}
      </div>
    </Screen>);
}