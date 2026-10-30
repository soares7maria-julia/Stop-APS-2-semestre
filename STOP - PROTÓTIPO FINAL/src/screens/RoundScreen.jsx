import React, { useState, useEffect, useRef } from 'react';
import { Screen, Button, Modal, PlayerCard } from '../components/ui';
import { useToast, ToastContainer } from '../components/ui';
import { MOCK_LOBBY_PLAYERS, DIFFICULTY_CONFIG } from '../gameState';
export function RoundScreen({ currentRound, totalRounds, categories, letter, usedLetters, totalTime, difficulty, isOwner, user, onLeave, onStop, onInstructions }) {
    const [phase, setPhase] = useState('playing');
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(totalTime);
    const [leaveModal, setLeaveModal] = useState(false);
    const [validationAttempted, setValidationAttempted] = useState(false);
    const [players, setPlayers] = useState(MOCK_LOBBY_PLAYERS.map(player => player.id === 'you' ? { ...player, name: user.name, avatar: user.avatar, isOwner, status: 'digitando' } : { ...player, status: 'digitando' }));
    const { toasts, add: addToast, remove: removeToast } = useToast();
    const timerRef = useRef(null);
    // Timer
    useEffect(() => {
        if (phase !== 'playing')
            return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    setPhase('timeout');
                    addToast('⏰ Tempo esgotado!', 'warning');
                    setTimeout(() => onStop(answers, 'timeout'), 900);
                    return 0;
                }
                if (t === Math.floor(totalTime * 0.25) + 1)
                    addToast('⚡ Menos de 25% do tempo!', 'warning');
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase]);
    function handleStop() {
        if (phase !== 'playing')
            return;
        if (!allAnswersValid) {
            setValidationAttempted(true);
            addToast(`Preencha todos os campos com palavras que comecem com a letra ${letter} para dar STOP!`, 'error');
            return;
        }
        clearInterval(timerRef.current);
        setPlayers(prev => prev.map(player => player.id === 'you' ? { ...player, status: 'pronto' } : player));
        addToast('Você pressionou STOP!', 'success');
        setPhase('sending');
        setTimeout(() => onStop(answers, 'stop'), 900);
    }
    function setAnswer(cat, val) {
        setAnswers(prev => ({ ...prev, [cat]: val }));
    }
    function validateAnswer(value) {
        if (value.trim() && value.trim().toLocaleUpperCase('pt-BR').startsWith(letter))
            addToast('Palavra válida!', 'success');
    }
    function kickPlayer(id) {
        setPlayers(prev => prev.filter(player => player.id !== id));
        addToast('Jogador removido da partida.', 'info');
    }
    const timerPct = (timeLeft / totalTime) * 100;
    const timerColor = timerPct > 50 ? 'var(--success)' : timerPct > 25 ? 'var(--warning)' : 'var(--danger)';
    const filled = Object.values(answers).filter(v => v.trim()).length;
    const isAnswerValid = (category) => {
        const value = answers[category]?.trim();
        return !!value && value.toLocaleUpperCase('pt-BR').startsWith(letter);
    };
    const allAnswersValid = categories.every(isAnswerValid);
    return (<Screen>
      <div className="sticky top-0 z-20 bg-[var(--card)]/90 backdrop-blur border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setLeaveModal(true)} className="w-9 h-9 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] flex items-center justify-center cursor-pointer border-0 text-[var(--foreground)] font-700 flex-shrink-0" aria-label="Sair da sala">←</button>
            <div className="font-700 text-[var(--muted-foreground)] text-sm">Rodada {currentRound}/{totalRounds}</div>
            <span className="bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-full px-2 py-1 text-xs font-700">{DIFFICULTY_CONFIG[difficulty]?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-600 text-[var(--muted-foreground)]">{filled}/{categories.length} preenchidos</span>
            <button onClick={onInstructions} className="w-7 h-7 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] flex items-center justify-center text-xs cursor-pointer border-0 hover:bg-[var(--border)]">?</button>
          </div>
        </div>
        {/* Timer bar */}
        <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timerPct}%`, backgroundColor: timerColor }}/>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-[var(--muted-foreground)]">Letras usadas: {usedLetters.join(' ')}</div>
          <div className="font-700 text-lg" style={{ color: timerColor }}>{timeLeft}s</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 max-w-6xl mx-auto w-full">
        <div className="flex-1 space-y-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]">
              <span className="font-display text-5xl text-white">{letter}</span>
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Todas as respostas</p>
              <h1 className="text-2xl text-[var(--foreground)]">devem começar com {letter}</h1>
            </div>
          </div>

        {/* Phase overlay messages */}
        {(phase === 'stopped' || phase === 'sending' || phase === 'timeout') && (<div className={`rounded-2xl p-4 text-center font-700 text-lg animate-fade-in ${phase === 'timeout' ? 'bg-[var(--warning)]/20 text-[var(--warning)]' : 'bg-[var(--success)]/20 text-[var(--success)]'}`}>
            {phase === 'timeout' ? '⏰ Tempo esgotado! Enviando respostas...' : '🛑 STOP! Enviando respostas...'}
          </div>)}

        {/* Answer fields */}
        <div className="space-y-3">
            {categories.map(cat => (<div key={cat} className="flex items-center gap-3">
                <span className="text-sm font-700 text-[var(--muted-foreground)] w-20 flex-shrink-0 text-right">{cat}</span>
                <div className="flex-1 relative">
                  <input value={answers[cat] || ''} onChange={e => setAnswer(cat, e.target.value)} onBlur={e => validateAnswer(e.target.value)} disabled={phase !== 'playing'} placeholder={`${letter}...`} className={`w-full px-4 py-3 rounded-xl border-2 bg-[var(--card)] text-[var(--card-foreground)] font-600 focus:outline-none transition-all ${answers[cat]?.trim()
                    ? isAnswerValid(cat)
                        ? 'border-[var(--success)] bg-[var(--success)]/5'
                        : validationAttempted
                            ? 'border-[var(--danger)] bg-[var(--danger)]/5'
                            : 'border-[var(--border)] focus:border-[var(--primary)]'
                    : validationAttempted
                        ? 'border-[var(--danger)] bg-[var(--danger)]/5'
                    : 'border-[var(--border)] focus:border-[var(--primary)]'} disabled:opacity-70`}/>
                  {isAnswerValid(cat) && (<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success)]">✓</span>)}
                </div>
              </div>))}
          </div>

        {/* STOP button */}
        {phase === 'playing' && (<button onClick={handleStop} aria-disabled={!allAnswersValid} className={`w-full py-5 rounded-3xl bg-gradient-to-r from-[var(--danger)] to-[var(--accent)] text-white font-display text-4xl shadow-2xl shadow-[var(--danger)]/40 border-0 transition-transform mt-4 ${allAnswersValid ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-40'}`}>
            STOP!
          </button>)}
        </div>

        <aside className="lg:w-80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg text-[var(--foreground)]">Jogadores na sala</h2>
            <span className="text-xs text-[var(--muted-foreground)]">{players.length} online</span>
          </div>
          <div className="space-y-2">
            {players.map(player => <PlayerCard key={player.id} {...player} isYou={player.id === 'you'} onKick={isOwner && player.id !== 'you' ? () => kickPlayer(player.id) : undefined}/>)}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={onInstructions}>Instruções</Button>
            <Button variant="danger" size="sm" onClick={() => setLeaveModal(true)}>Sair da sala</Button>
          </div>
        </aside>
      </div>

      <Modal open={leaveModal} onClose={() => setLeaveModal(false)} title={isOwner ? 'Fechar a sala?' : 'Sair da sala?'} size="sm">
        <div className="space-y-4">
          <p className="text-[var(--muted-foreground)]">
            {isOwner ? 'Como dono, sair encerrará a sala e todos serão redirecionados ao menu principal.' : 'Suas respostas desta rodada não serão salvas. Deseja continuar?'}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setLeaveModal(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={onLeave}>{isOwner ? 'Fechar sala' : 'Sair'}</Button>
          </div>
        </div>
      </Modal>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </Screen>);
}
