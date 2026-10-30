import React, { useEffect, useState } from 'react';
import { Screen, Badge } from '../components/ui';

const LETTERS = 'ABCDEFGHIJKLMNOPRSTV';

export function LetterDrawScreen({ currentRound, totalRounds, letter, usedLetters, onComplete }) {
    const [shownLetter, setShownLetter] = useState('?');
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        let step = 0;
        const shuffle = setInterval(() => {
            setShownLetter(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
            step += 1;
            if (step >= 12) {
                clearInterval(shuffle);
                setShownLetter(letter);
                setRevealed(true);
            }
        }, 100);
        const advance = setTimeout(onComplete, 7800);
        return () => {
            clearInterval(shuffle);
            clearTimeout(advance);
        };
    }, [letter, onComplete]);

    const previousLetters = usedLetters.filter(item => item !== letter);

    return (
        <Screen className="items-center justify-center p-4">
          <div className="w-full max-w-lg text-center space-y-8">
            <div className="space-y-2">
              <Badge color="primary">Rodada {currentRound} de {totalRounds}</Badge>
              <h1 className="text-3xl sm:text-4xl text-[var(--foreground)]">Sorteando a letra...</h1>
              <p className="text-[var(--muted-foreground)]">A mesma letra aparece para todos ao mesmo tempo.</p>
            </div>

            <div className={`mx-auto w-44 h-44 sm:w-52 sm:h-52 rounded-[2.5rem] flex items-center justify-center shadow-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] ${revealed ? 'animate-bounce-in' : 'letter-spin'}`}>
              <span className="font-display text-8xl sm:text-9xl text-white">{shownLetter}</span>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
              <p className="text-xs font-700 uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Letras já usadas</p>
              {previousLetters.length ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {previousLetters.map(item => <Badge key={item} color="muted">{item}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">Esta é a primeira rodada.</p>
              )}
            </div>

            <p className="text-sm font-700 text-[var(--primary)]">
              {revealed ? `Letra ${letter}! Prepare-se...` : 'Sincronizando com a sala...'}
            </p>
          </div>
        </Screen>
    );
}
