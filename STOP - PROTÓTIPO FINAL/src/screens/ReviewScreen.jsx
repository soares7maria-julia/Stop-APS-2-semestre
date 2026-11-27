// Permite ao dono conferir e pontuar as respostas enviadas pelos participantes da rodada.
import React, { useMemo, useState } from 'react';
import { Screen, TopBar, Card, Button } from '../components/ui';
import { isValidAnswer, answerText, normalizeText } from '../lib/scoring';

export function ReviewScreen({ currentRound, totalRounds, letter, categories, answers, roomPlayers = [], user, isOwner, onBack, onFinish }) {
    const [selectedCategory, setSelectedCategory] = useState(0);
    const hasPlayerAnswers = roomPlayers.some(player => Object.hasOwn(answers ?? {}, player.id));
    const submissions = hasPlayerAnswers ? answers : { [user.id]: answers };
    const players = roomPlayers.length
        ? roomPlayers.map(player => ({ id: player.id, name: player.name, submission: submissions[player.id] }))
        : [{ id: user.id, name: user.name, submission: submissions[user.id] }];
    const submittedCount = players.filter(player => player.submission).length;
    const allSubmitted = submittedCount === players.length;
    const rows = useMemo(() => categories.map(category => {
        const values = players.map(({ id, submission }) => {
            if (!submission) return { id, value: '', situation: 'Enviando respostas…', points: 0 };
            const value = answerText(submission?.[category]).trim();
            const valid = isValidAnswer(value, letter);
            const repeated = valid && players.some(other => other.id !== id && normalizeText(answerText(other.submission?.[category])) === normalizeText(value));
            return { id, value: value.length > 1 ? value : '', situation: !value || value.length < 2 ? 'Em branco' : !valid ? 'Inválida' : repeated ? 'Repetida' : 'Única', points: valid ? repeated ? 5 : 10 : 0 };
        });
        return { category, values };
    }), [answers, categories, letter, roomPlayers]);
    const ownScore = rows.reduce((sum, row) => sum + (row.values.find(value => value.id === user.id)?.points ?? 0), 0);
    const active = rows[selectedCategory];

    return (<Screen>
      <TopBar title={`Revisão – Letra ${letter}`} subtitle={`Rodada ${currentRound}/${totalRounds}`} onBack={onBack}/>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-5 pb-36 space-y-5">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          Única e válida: 10 pts · Em branco ou inválida: 0 pts.
        </p>

        <nav role="tablist" aria-label="Categorias da revisão" className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
          {categories.map((category, index) => (<Button key={category} variant="ghost" size="sm" role="tab" aria-selected={selectedCategory === index} onClick={() => setSelectedCategory(index)} className={`shrink-0 !rounded-none border-b-2 !px-4 !py-3 ${selectedCategory === index ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)]'}`}>
            {category}
          </Button>))}
        </nav>

        {active && (<section role="tabpanel" aria-label={`Respostas de ${active.category}`}>
          <div className="flex items-center justify-between gap-3 mb-3">
          <div className="font-display text-xl text-[var(--foreground)]">{active.category}</div>
            <span className="text-sm text-[var(--muted-foreground)]">{selectedCategory + 1} de {categories.length}</span>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--card-foreground)]">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-700">Jogador</th>
                  <th scope="col" className="px-4 py-3 font-700">Resposta</th>
                  <th scope="col" className="px-4 py-3 font-700">Situação</th>
                  <th scope="col" className="px-4 py-3 font-700">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {active.values.map(row => <tr key={row.id}>
                  <td className="px-4 py-4 font-700">{row.id === user.id ? `${user.name} (você)` : players.find(player => player.id === row.id)?.name ?? row.id}</td>
                  <td className="px-4 py-4 break-words">{row.value || '—'}</td><td className="px-4 py-4">{row.situation}</td><td className="px-4 py-4 tabular-nums">{row.points}</td>
                </tr>)}
              </tbody>
            </table>
          </Card>
          <div className="flex justify-between gap-3 mt-4">
            <Button variant="secondary" size="sm" disabled={selectedCategory === 0} onClick={() => setSelectedCategory(index => index - 1)}>Anterior</Button>
            <Button variant="secondary" size="sm" disabled={selectedCategory === categories.length - 1} onClick={() => setSelectedCategory(index => index + 1)}>Próxima categoria</Button>
          </div>
        </section>)}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-20 bg-[var(--card)] border-t border-[var(--border)] px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="font-700 text-[var(--card-foreground)]">{isOwner ? <>{allSubmitted ? 'Confira as respostas da sala' : `Recebendo respostas: ${submittedCount}/${players.length}`} · sua prévia: <span className="text-[var(--primary)] tabular-nums">{ownScore}</span></> : 'Todos podem conferir as respostas · aguardando o dono publicar o resultado...'}</span>
          {isOwner && <Button disabled={!allSubmitted} onClick={onFinish}>Publicar Resultado</Button>}
        </div>
      </div>
    </Screen>);
}
