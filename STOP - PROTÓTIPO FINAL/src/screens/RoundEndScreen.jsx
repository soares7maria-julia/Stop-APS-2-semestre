import React, { useEffect } from 'react';
import { Screen, Card } from '../components/ui';

export function RoundEndScreen({ reason, stoppedBy, onComplete }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2600);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const timedOut = reason === 'timeout';

    return (
        <Screen className="items-center justify-center p-4">
          <Card className="w-full max-w-lg p-7 sm:p-10 text-center space-y-5 animate-bounce-in">
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center font-display text-3xl ${timedOut ? 'bg-[var(--warning)]/20 text-[var(--warning)]' : 'bg-[var(--danger)]/15 text-[var(--danger)]'}`}>
              {timedOut ? '0:00' : 'STOP'}
            </div>
            <div>
              <h1 className="text-3xl text-[var(--foreground)]">
                {timedOut ? 'Tempo esgotado!' : `${stoppedBy} deu STOP!`}
              </h1>
              <p className="text-[var(--muted-foreground)] mt-2">
                Suas respostas foram enviadas automaticamente.
              </p>
            </div>
            <div className="bg-[var(--muted)] rounded-2xl p-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"/>
                <span className="font-700 text-[var(--primary)]">Validando as palavras...</span>
              </div>
            </div>
          </Card>
        </Screen>
    );
}
