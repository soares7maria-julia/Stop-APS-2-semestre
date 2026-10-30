import React, { useMemo, useState } from 'react';
import { Screen, TopBar, Card, Button, Modal } from '../components/ui';
import { MOCK_REVIEW } from '../gameState';

const scoreFor = answer => answer.value?.trim() && answer.isValid === true && !answer.contested
    ? (answer.isRepeated ? 5 : 10) : 0;

export function ReviewScreen({ currentRound, totalRounds, letter, categories, answers, onBack, onFinish }) {
    const initialReviews = useMemo(() => categories.map(category => {
        const mockCategory = MOCK_REVIEW.find(item => item.category === category);
        if (mockCategory) {
            return {
                ...mockCategory,
                answers: mockCategory.answers.map(answer => answer.playerId === 'you'
                    ? { ...answer, value: answers?.[category] ?? answer.value, isValid: (answers?.[category] ?? answer.value).trim().toLocaleUpperCase('pt-BR').startsWith(letter) }
                    : answer)
            };
        }
        return {
            category,
            answers: [
                { playerId: 'you', playerName: 'Você', playerAvatar: '🦊', value: answers?.[category] || '', isValid: !!answers?.[category]?.trim().toLocaleUpperCase('pt-BR').startsWith(letter), isRepeated: false },
                { playerId: 'p2', playerName: 'Ana Lima', playerAvatar: '🐼', value: `${letter}${category.toLocaleLowerCase('pt-BR')}`, isValid: true, isRepeated: false },
                { playerId: 'p3', playerName: 'Carlos Neto', playerAvatar: '🐸', value: '', isValid: false, isRepeated: false },
                { playerId: 'p4', playerName: 'Mariana Costa', playerAvatar: '🦋', value: `${letter}${category.toLocaleLowerCase('pt-BR')}`, isValid: true, isRepeated: true },
            ]
        };
    }), [answers, categories, letter]);
    const [reviews, setReviews] = useState(initialReviews);
    const [selectedCategory, setSelectedCategory] = useState(0);
    const [contestModal, setContestModal] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [finished, setFinished] = useState(false);

    React.useEffect(() => {
        if (finished) return;
        const timer = setInterval(() => {
            setTimeLeft(n => {
                if (n <= 1) {
                    clearInterval(timer);
                    setFinished(true);
                    return 0;
                }
                return n - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [finished]);

    function confirmContest() {
        if (!contestModal) return;
        setReviews(prev => prev.map(item => item.category === contestModal.category ? {
            ...item,
            answers: item.answers.map(entry => entry.playerId === contestModal.playerId
                ? { ...entry, contested: true, votesToReject: 1, totalVoters: 4 }
                : entry)
        } : item));
        setContestModal(null);
    }

    function vote(category, playerId, reject) {
        // The remaining players' votes are simulated in this local multiplayer prototype.
        setReviews(prev => prev.map(item => item.category === category ? {
            ...item,
            answers: item.answers.map(entry => entry.playerId === playerId && entry.contested && !entry.voteResult ? {
                ...entry,
                contested: false,
                isValid: !reject,
                votesToReject: reject ? 3 : 1,
                voteResult: reject ? 'Recusada' : 'Válida'
            } : entry)
        } : item));
    }

    const activeReview = reviews[selectedCategory];
    const ownScore = reviews.reduce((sum, item) => sum + scoreFor(item.answers.find(answer => answer.playerId === 'you') || {}), 0);

    return (<Screen>
      <TopBar title={`Revisão – Letra ${letter}`} subtitle={`Rodada ${currentRound}/${totalRounds}`} onBack={onBack} rightSlot={<div className="font-700 text-[var(--primary)] tabular-nums" aria-label={`${timeLeft} segundos restantes`}>{timeLeft}s restantes</div>}/>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-5 pb-36 space-y-5">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          Única: 10 pts · Repetida: 5 pts · Inválida ou em branco: 0 pts. Clique em &quot;Contestar&quot; para questionar a resposta de outro jogador.
        </p>

        <nav role="tablist" aria-label="Categorias da revisão" className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
          {categories.map((category, index) => (<Button key={category} variant="ghost" size="sm" role="tab" aria-selected={selectedCategory === index} aria-controls="review-category" onClick={() => setSelectedCategory(index)} className={`shrink-0 !rounded-none border-b-2 !px-4 !py-3 ${selectedCategory === index ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)]'}`}>
            {category}
          </Button>))}
        </nav>

        {activeReview && (<section id="review-category" role="tabpanel" aria-label={`Respostas de ${activeReview.category}`}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-display text-xl text-[var(--foreground)]">{activeReview.category}</div>
            <span className="text-sm text-[var(--muted-foreground)]">{selectedCategory + 1} de {categories.length}</span>
          </div>
          <Card className="overflow-hidden">
            <table className="block sm:table w-full text-sm text-left text-[var(--card-foreground)]">
              <thead className="hidden sm:table-header-group bg-[var(--muted)] text-[var(--muted-foreground)]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-700">Jogador</th>
                  <th scope="col" className="px-4 py-3 font-700">Resposta</th>
                  <th scope="col" className="px-4 py-3 font-700">Situação</th>
                  <th scope="col" className="px-4 py-3 font-700">Pontos</th>
                  <th scope="col" className="px-4 py-3 font-700">Ação</th>
                </tr>
              </thead>
              <tbody className="block sm:table-row-group">
                {activeReview.answers.map(answer => {
                    const points = scoreFor(answer);
                    const situation = !answer.value?.trim() ? 'Em branco' : answer.contested ? 'Em votação' : answer.voteResult || (answer.isValid ? 'Válida' : 'Inválida');
                    return (<tr key={answer.playerId} className="block sm:table-row border-b border-[var(--border)] last:border-b-0 px-4 py-4 sm:p-0">
                      <td className="flex items-center gap-3 py-1 sm:table-cell sm:px-4 sm:py-4">
                        <span className="w-24 shrink-0 text-[var(--muted-foreground)] font-700 sm:hidden">Jogador</span>
                        <span className="inline-flex items-center gap-2 font-700">
                          <span className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center shrink-0" aria-hidden="true">{answer.playerAvatar}</span>
                          <span>{answer.playerName}{answer.playerId === 'you' ? ' (você)' : ''}</span>
                        </span>
                      </td>
                      <td className="flex gap-3 py-1 sm:table-cell sm:px-4 sm:py-4 break-words">
                        <span className="w-24 shrink-0 text-[var(--muted-foreground)] font-700 sm:hidden">Resposta</span>
                        <span>{answer.value?.trim() || '—'}</span>
                      </td>
                      <td className="flex gap-3 py-1 sm:table-cell sm:px-4 sm:py-4">
                        <span className="w-24 shrink-0 text-[var(--muted-foreground)] font-700 sm:hidden">Situação</span>
                        <span>{situation}{answer.contested && <span className="block text-xs text-[var(--muted-foreground)]">Votos para recusar: {answer.votesToReject ?? 1} de {answer.totalVoters ?? 4}</span>}</span>
                      </td>
                      <td className="flex gap-3 py-1 sm:table-cell sm:px-4 sm:py-4 tabular-nums">
                        <span className="w-24 shrink-0 text-[var(--muted-foreground)] font-700 sm:hidden">Pontos</span>
                        <span>{points === 5 ? '5 (repetida)' : points}</span>
                      </td>
                      <td className="pt-3 sm:px-4 sm:py-4">
                        {answer.playerId !== 'you' && answer.value?.trim() && (answer.contested
                            ? <div className="flex flex-wrap gap-1">
                                <Button variant="secondary" size="sm" onClick={() => vote(activeReview.category, answer.playerId, true)}>Recusar</Button>
                                <Button variant="ghost" size="sm" onClick={() => vote(activeReview.category, answer.playerId, false)}>Manter</Button>
                              </div>
                            : !answer.voteResult && <Button variant="ghost" size="sm" className="text-[var(--primary)]" onClick={() => setContestModal({ ...answer, category: activeReview.category })}>Contestar</Button>)}
                      </td>
                    </tr>);
                })}
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
          <span className="font-700 text-[var(--card-foreground)]">Seus pontos nesta rodada: <span className="text-[var(--primary)] tabular-nums">{ownScore}</span></span>
          <Button onClick={onFinish}>{finished ? 'Ver Resultado' : `Pular revisão (${timeLeft}s)`}</Button>
        </div>
      </div>

      <Modal open={!!contestModal} onClose={() => setContestModal(null)} title="Contestar resposta" size="sm">
        {contestModal && (<div className="space-y-5">
          <p className="text-[var(--card-foreground)]">Contestar a resposta &quot;{contestModal.value}&quot; de {contestModal.playerName}?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setContestModal(null)}>Cancelar</Button>
            <Button onClick={confirmContest}>Contestar</Button>
          </div>
        </div>)}
      </Modal>
    </Screen>);
}
