// Exibe as respostas da rodada, permite contestar palavras e mostra os pontos após a revisão.
import React from 'react';
import { Screen, TopBar, Card, Button } from '../components/ui';
import { answerText, isValidAnswer, normalizeText, contestAnswerKey, contestVoteThreshold, isAnswerRejected } from '../lib/scoring';

export function RoundResultScreen({ currentRound, totalRounds, letter, categories, isLastRound, user, isOwner, isPublished, allSubmitted, roundResult, totalScore, players: roomScores = [], roomPlayers = [], answers = {}, contestVotes = {}, rejectedAnswers = [], reviewedPlayers = [], onContestAnswer, onToggleReview, onPublish, onNext }) {
    const threshold = contestVoteThreshold(roomPlayers.length);
    const reviewed = reviewedPlayers.includes(user.id);
    const allReviewed = roomPlayers.length > 0 && roomPlayers.every(player => reviewedPlayers.includes(player.id));
    const responseGroups = categories.map(category => {
        const rows = [...roomPlayers]
          .sort((a, b) => Number(b.id === user.id) - Number(a.id === user.id))
          .map(player => {
            const value = answerText(answers[player.id]?.[category]).trim();
            const valid = isValidAnswer(value, letter);
            const repeated = valid && !isAnswerRejected(category, player.id, rejectedAnswers) && roomPlayers.some(other =>
                other.id !== player.id
                && !isAnswerRejected(category, other.id, rejectedAnswers)
                && isValidAnswer(answers[other.id]?.[category], letter)
                && normalizeText(answerText(answers[other.id]?.[category])) === normalizeText(value));
            const rejected = isAnswerRejected(category, player.id, rejectedAnswers);
            const key = contestAnswerKey(category, player.id);
            const voters = (contestVotes[key] ?? []).filter(voterId => voterId !== player.id);
            const calculatedPoints = rejected || !valid ? 0 : repeated ? 5 : 10;
            const points = isPublished && player.id === user.id
                ? roundResult?.breakdown?.[category] ?? calculatedPoints
                : calculatedPoints;
            return { ...player, value, valid, repeated, rejected, voters, points };
        });
        return { category, rows };
    });
    const ownBreakdown = Object.fromEntries(responseGroups.map(group => [
        group.category,
        group.rows.find(row => row.id === user.id)?.points ?? 0,
    ]));
    const ownScore = isPublished ? (roundResult?.total ?? 0) : Object.values(ownBreakdown).reduce((sum, points) => sum + points, 0);
    const ownRejectedCategories = responseGroups
        .filter(group => group.rows.find(row => row.id === user.id)?.rejected)
        .map(group => group.category);
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

        {ownRejectedCategories.length > 0 && <Card className="p-4 border border-[var(--danger)]/40 bg-[var(--danger)]/5" role="status" aria-live="polite">
          <p className="font-700 text-[var(--danger)]">Sua resposta foi excluída pela votação dos jogadores.</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Categoria(s): {ownRejectedCategories.join(', ')}. Essa resposta vale 0 pontos.</p>
        </Card>}

        <Card className="p-5">
          <h2 className="text-xl text-[var(--foreground)] mb-2">📝 Respostas de todos</h2>
          {!isPublished && <p className="text-sm text-[var(--muted-foreground)] mb-4">Conteste uma resposta que não seja sua. A maioria dos outros jogadores a exclui e retira seus pontos. Respostas excluídas não podem ser recuperadas.</p>}
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
                    const row = rows.find(item => item.id === player.id);
                    const voted = row?.voters.includes(user.id);
                    return <td key={player.id} className={`px-4 py-3 ${row?.rejected ? 'bg-[var(--danger)]/5' : ''}`}>
                      <div className="flex items-center justify-between gap-4">
                        <span className={`${row?.rejected ? 'text-[var(--danger)] line-through' : 'text-[var(--foreground)]'}`}>{row?.rejected ? 'Resposta excluída pela votação' : row?.value || '—'}</span>
                        <span className={`font-700 tabular-nums whitespace-nowrap ${row?.points > 0 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}`}>{row?.points ?? 0} pts</span>
                      </div>
                      {!isPublished && row?.valid && player.id !== user.id && !row?.rejected && <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-[var(--muted-foreground)]">{row.voters.length}/{Math.max(0, roomPlayers.length - 1)} votos · maioria: {threshold}</span>
                        <Button size="sm" variant={voted ? 'secondary' : 'ghost'} disabled={reviewed} onClick={() => onContestAnswer(category, player.id)}>
                          {voted ? 'Retirar voto' : 'Contestar'}
                        </Button>
                      </div>}
                      {row?.rejected && <p className="mt-2 text-xs font-700 text-[var(--danger)]">Excluída por maioria</p>}
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

        {!isPublished && <Card className="p-4 space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">{allSubmitted ? `Revisões concluídas: ${reviewedPlayers.length}/${roomPlayers.length}. Ao confirmar, seus votos ficam fechados; você pode reabrir antes da publicação.` : 'Aguardando as respostas de todos para liberar a confirmação da revisão.'}</p>
          <Button variant={reviewed ? 'secondary' : 'ghost'} className="w-full" disabled={!allSubmitted && !reviewed} onClick={onToggleReview}>
            {reviewed ? 'Reabrir minha revisão' : '✅ Concluí minha revisão'}
          </Button>
        </Card>}

        {!isPublished && isOwner && <Button size="xl" className="w-full" disabled={!allSubmitted || !allReviewed} onClick={onPublish}>
          {!allSubmitted ? `⏳ Aguardando respostas (${roomPlayers.filter(player => !!answers[player.id]).length}/${roomPlayers.length})` : !allReviewed ? '⏳ Aguardando todos concluírem a revisão' : '✅ Publicar resultado para todos'}
        </Button>}
        {!isPublished && !isOwner && <p className="text-center text-sm text-[var(--muted-foreground)]">Depois da revisão, o dono publicará o resultado para todos.</p>}
        {isPublished && isOwner && <Button size="xl" className="w-full" onClick={onNext}>
          {isLastRound ? '🏁 Ver Resultado Final' : `▶ Próxima Rodada (${currentRound + 1}/${totalRounds})`}
        </Button>}
        {isPublished && !isOwner && <p className="text-center text-sm text-[var(--muted-foreground)]">Resultado publicado · aguardando o dono iniciar a próxima rodada...</p>}
      </div>
    </Screen>);
}
