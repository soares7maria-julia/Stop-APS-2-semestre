// Exibe respostas e pontuação por categoria e jogador, e permite publicar ou avançar.
import React from 'react';
import { Screen, TopBar, Card, Button } from '../components/ui';
import { answerText, isValidAnswer, normalizeText } from '../lib/scoring';

export function RoundResultScreen({ currentRound, totalRounds, letter, categories, isLastRound, user, isOwner, isPublished, allSubmitted, roundResult, totalScore, players: roomScores = [], roomPlayers = [], answers = {}, onPublish, onNext }) {
    const responseGroups = categories.map(category => {
        const rows = [...roomPlayers]
          .sort((a, b) => Number(b.id === user.id) - Number(a.id === user.id))
          .map(player => {
            const value = answerText(answers[player.id]?.[category]).trim();
            const valid = isValidAnswer(value, letter);
            const repeated = valid && roomPlayers.some(other => other.id !== player.id && normalizeText(answerText(answers[other.id]?.[category])) === normalizeText(value));
            const points = roundResult?.breakdown && player.id === user.id
                ? roundResult.breakdown[category] ?? 0
                : valid ? repeated ? 5 : 10 : 0;
            return { ...player, value, points };
        });
        return { category, rows };
    });
    const previewBreakdown = Object.fromEntries(responseGroups.map(group => [
        group.category,
        group.rows.find(row => row.id === user.id)?.points ?? 0,
    ]));
    const ownScore = isPublished ? (roundResult?.total ?? 0) : Object.values(previewBreakdown).reduce((sum, points) => sum + points, 0);
    const ownBreakdown = isPublished ? (roundResult?.breakdown ?? previewBreakdown) : previewBreakdown;
    const playerColumns = [...roomPlayers].sort((a, b) => Number(b.id === user.id) - Number(a.id === user.id));

    return (<Screen>
      <TopBar title={`Resultado — Rodada ${currentRound}/${totalRounds}`} subtitle={`Letra: ${letter}`}/>
      <div className="flex-1 p-4 space-y-4 max-w-2xl mx-auto w-full pb-8 overflow-y-auto">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{user.avatar}</span>
            <div>
              <div className="font-700 text-[var(--foreground)]">Sua pontuação nesta rodada</div>
              <div className="text-3xl font-700 text-[var(--primary)]">+{ownScore} pts</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map(category => {
                const points = ownBreakdown[category] ?? 0;
                return (<div key={category} className={`rounded-xl p-2.5 text-center border ${points > 0 ? 'border-[var(--success)]/30 bg-[var(--success)]/5' : 'border-[var(--border)] bg-[var(--muted)]'}`}>
                  <div className="text-xs text-[var(--muted-foreground)] font-600">{category}</div>
                  <div className={`font-700 text-lg ${points > 0 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}`}>{points > 0 ? `+${points}` : '—'}</div>
                </div>);
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl text-[var(--foreground)] mb-4">📝 Respostas de todos</h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-max text-sm text-left text-[var(--card-foreground)]">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-[var(--muted)] px-4 py-3 font-700">Categoria</th>
                  {playerColumns.map(player => <th scope="col" key={player.id} className="min-w-40 px-4 py-3 font-700">
                    <span className="inline-flex items-center gap-2"><span className="text-lg">{player.avatar}</span><span>{player.name}{player.id === user.id && <span className="text-[var(--primary)]"> (você)</span>}</span></span>
                  </th>)}
                </tr>
              </thead>
              <tbody>
                {responseGroups.map(({ category, rows }) => <tr key={category} className="border-t border-[var(--border)]">
                  <th scope="row" className="sticky left-0 z-10 bg-[var(--card)] px-4 py-3 font-700">{category}</th>
                  {playerColumns.map(player => {
                    const row = rows.find(item => item.id === player.id)
                    return <td key={player.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--foreground)]">{row?.value || '—'}</span>
                        <span className={`font-700 tabular-nums whitespace-nowrap ${row?.points > 0 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}`}>{row?.points ?? 0} pts</span>
                      </div>
                    </td>
                  })}
                </tr>)}
              </tbody>
            </table>
          </div>
        </Card>

        {isPublished && <Card className="p-5">
          <h2 className="text-xl text-[var(--foreground)] mb-4">🏆 Placar Geral</h2>
          <div className="space-y-2">
            {[...roomScores].sort((a, b) => b.totalScore - a.totalScore).map((player, index) => <div key={player.playerId} className={`flex items-center gap-3 p-3 rounded-2xl ${player.playerId === user.id ? 'bg-[var(--primary)]/10 border border-[var(--primary)]' : 'bg-[var(--muted)]'}`}>
              <span className="text-xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}</span>
              <span className="text-xl">{player.avatar}</span>
              <div className="flex-1 font-700 text-[var(--card-foreground)]">{player.name}{player.playerId === user.id && <span className="text-xs text-[var(--primary)]"> (você)</span>}</div>
              <div className="text-right"><div className="text-xs text-[var(--muted-foreground)]">+{player.roundScore} nesta rodada</div><div className="font-700 text-xl text-[var(--primary)]">{player.totalScore}</div></div>
            </div>)}
          </div>
        </Card>}

        {!isPublished && isOwner && <Button size="xl" className="w-full" disabled={!allSubmitted} onClick={onPublish}>
          {allSubmitted ? '✅ Publicar resultado para todos' : `⏳ Aguardando respostas (${roomPlayers.filter(player => !!answers[player.id]).length}/${roomPlayers.length})`}
        </Button>}
        {!isPublished && !isOwner && <p className="text-center text-sm text-[var(--muted-foreground)]">Você já pode conferir as respostas · aguardando o dono publicar o resultado...</p>}
        {isPublished && isOwner && <Button size="xl" className="w-full" onClick={onNext}>
          {isLastRound ? '🏁 Ver Resultado Final' : `▶ Próxima Rodada (${currentRound + 1}/${totalRounds})`}
        </Button>}
        {isPublished && !isOwner && <p className="text-center text-sm text-[var(--muted-foreground)]">Resultado publicado · aguardando o dono iniciar a próxima rodada...</p>}
      </div>
    </Screen>);
}
