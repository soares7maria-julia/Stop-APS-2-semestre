import React, { useState, useEffect } from 'react';
import { AuthScreen } from './screens/AuthScreen';
import { MenuScreen } from './screens/MenuScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { RoundScreen } from './screens/RoundScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { RoundResultScreen } from './screens/RoundResultScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { RankingScreen } from './screens/RankingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LetterDrawScreen } from './screens/LetterDrawScreen';
import { RoundEndScreen } from './screens/RoundEndScreen';
import { Modal, AVATARS } from './components/ui';
import { getSession, onAuthChange, signOut } from './services/authService';

export default function App() {
    const [screen, setScreen] = useState('auth');
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [soundOn, setSoundOn] = useState(true);
    const [room, setRoom] = useState(null);
    const [isOwner, setIsOwner] = useState(true);
    const [currentRound, setCurrentRound] = useState(1);
    const [usedLetters, setUsedLetters] = useState([]);
    const [currentLetter, setCurrentLetter] = useState('B');
    const [instrOpen, setInstrOpen] = useState(false);
    const [roundAnswers, setRoundAnswers] = useState({});
    const [stopReason, setStopReason] = useState('stop');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    useEffect(() => {
        function toUser(session) {
            const u = session.user;
            return {
                id: u.id,
                name: u.user_metadata?.username || u.email.split('@')[0],
                avatar: u.user_metadata?.avatar || AVATARS[0],
                isGuest: false,
            };
        }
        getSession()
            .then(session => {
                if (session) {
                    setUser(toUser(session));
                    setScreen('menu');
                }
            })
            .catch(console.error)
            .finally(() => setChecking(false));
        const unsubscribe = onAuthChange(session => {
            if (session) {
                setUser(toUser(session));
                setScreen(s => (s === 'auth' ? 'menu' : s));
            }
            else {
                setUser(u => (u?.isGuest ? u : null));
            }
        });
        return unsubscribe;
    }, []);

    function handleAuth(u) {
        setUser(u);
        setScreen('menu');
    }

    async function handleLogout() {
        try {
            if (user && !user.isGuest) await signOut();
        }
        catch (err) {
            console.error(err);
        }
        setUser(null);
        setScreen('auth');
    }

    function handleJoinRoom(r) {
        setRoom(r);
        setIsOwner(false);
        setCurrentRound(1);
        setUsedLetters([]);
        setScreen('lobby');
    }
    function handleCreateRoom(r) {
        setRoom(r);
        setIsOwner(true);
        setCurrentRound(1);
        setUsedLetters([]);
        setScreen('lobby');
    }
    function startGame() {
        const letter = pickLetter(usedLetters);
        setCurrentLetter(letter);
        setUsedLetters(prev => [...prev, letter]);
        setScreen('letter-draw');
    }
    function handleStop(answers, reason = 'stop') {
        setRoundAnswers(answers);
        setStopReason(reason);
        setScreen('round-end');
    }
    function handleReviewFinish() {
        setScreen('round-result');
    }
    function handleNextRound() {
        const total = room?.totalRounds ?? 5;
        if (currentRound >= total) {
            setScreen('game-over');
        }
        else {
            const letter = pickLetter(usedLetters);
            setCurrentLetter(letter);
            setUsedLetters(prev => [...prev, letter]);
            setCurrentRound(r => r + 1);
            setScreen('letter-draw');
        }
    }
    function handleNewGame() {
        setCurrentRound(1);
        setUsedLetters([]);
        const letter = pickLetter([]);
        setCurrentLetter(letter);
        setUsedLetters([letter]);
        setScreen('letter-draw');
    }
    function handleLeave() {
        setRoom(null);
        setScreen('menu');
    }

    const categories = room?.categories ?? ['Nome', 'Animal', 'Cidade', 'Cor', 'Fruta'];
    const totalRounds = room?.totalRounds ?? 5;
    const totalTime = room ? (room.difficulty === 'facil' ? 120 : room.difficulty === 'medio' ? 90 : 60) : 90;

    if (checking) return null;

    return (<>
      {screen === 'auth' && <AuthScreen onAuth={handleAuth}/>}

      {screen === 'menu' && user && (<MenuScreen user={user} darkMode={darkMode} soundOn={soundOn} onToggleDark={() => setDarkMode(d => !d)} onToggleSound={() => setSoundOn(s => !s)} onBack={handleLogout} onJoin={() => setScreen('join-room')} onCreate={() => setScreen('create-room')} onRanking={() => setScreen('ranking')} onProfile={() => setScreen('profile')}/>)}

      {screen === 'join-room' && (<JoinRoomScreen onBack={() => setScreen('menu')} onJoin={handleJoinRoom}/>)}

      {screen === 'create-room' && user && (<CreateRoomScreen onBack={() => setScreen('menu')} onCreated={handleCreateRoom} user={user}/>)}

      {screen === 'lobby' && room && user && (<LobbyScreen room={room} user={user} isOwner={isOwner} onStart={startGame} onLeave={handleLeave}/>)}

      {screen === 'letter-draw' && (<LetterDrawScreen currentRound={currentRound} totalRounds={totalRounds} letter={currentLetter} usedLetters={usedLetters} onComplete={() => setScreen('round')}/>)}

      {screen === 'round' && room && user && (<RoundScreen currentRound={currentRound} totalRounds={totalRounds} categories={categories} letter={currentLetter} usedLetters={usedLetters.slice(0, -1)} totalTime={totalTime} difficulty={room.difficulty} isOwner={isOwner} user={user} onLeave={handleLeave} onStop={handleStop} onInstructions={() => setInstrOpen(true)}/>)}

      {screen === 'round-end' && (<RoundEndScreen reason={stopReason} stoppedBy="Você" onComplete={() => setScreen('review')}/>)}

      {screen === 'review' && (<ReviewScreen currentRound={currentRound} totalRounds={totalRounds} letter={currentLetter} categories={categories} answers={roundAnswers} onBack={() => setScreen('round-end')} onFinish={handleReviewFinish}/>)}

      {screen === 'round-result' && (<RoundResultScreen currentRound={currentRound} totalRounds={totalRounds} letter={currentLetter} categories={categories} isLastRound={currentRound >= totalRounds} onBack={() => setScreen('review')} onNext={handleNextRound}/>)}

      {screen === 'game-over' && (<GameOverScreen isOwner={isOwner} onBack={() => setScreen('round-result')} onNewGame={handleNewGame} onMenu={() => setScreen('menu')}/>)}

      {screen === 'ranking' && (<RankingScreen isGuest={user?.isGuest} onBack={() => setScreen('menu')}/>)}

      {screen === 'profile' && user && (<ProfileScreen user={user} onBack={() => setScreen('menu')} onUpdateUser={u => { setUser(u); setScreen('menu'); }}/>)}

      {/* Instructions modal (accessible anywhere during game) */}
      <Modal open={instrOpen} onClose={() => setInstrOpen(false)} title="📖 Como Jogar" size="md">
        <div className="space-y-4 text-[var(--card-foreground)]">
          <p className="text-sm text-[var(--muted-foreground)]">
            Uma letra é sorteada a cada rodada. Preencha uma palavra começando com ela para cada categoria. Quando terminar, pressione <strong>STOP!</strong> para encerrar a rodada para todos.
          </p>
          <div className="bg-[var(--muted)] rounded-2xl p-4">
            <p className="font-700 text-sm text-[var(--foreground)] mb-2">💡 Pontuação</p>
            <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
              <div className="flex justify-between"><span>Resposta única e válida</span><span className="font-700 text-[var(--success)]">10 pts</span></div>
              <div className="flex justify-between"><span>Resposta repetida e válida</span><span className="font-700 text-[var(--warning)]">5 pts</span></div>
              <div className="flex justify-between"><span>Campo em branco ou inválido</span><span className="font-700 text-[var(--danger)]">0 pts</span></div>
            </div>
          </div>
        </div>
      </Modal>
    </>);
}

function pickLetter(used) {
    const LETTERS = 'ABCDEFGHIJKLMNOPRSTV';
    const available = LETTERS.split('').filter(l => !used.includes(l));
    if (available.length === 0)
        return LETTERS[Math.floor(Math.random() * LETTERS.length)];
    return available[Math.floor(Math.random() * available.length)];
}