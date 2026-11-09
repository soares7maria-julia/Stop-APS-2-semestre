import React, { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { JoinRoomScreen } from '../screens/JoinRoomScreen'
import { CreateRoomScreen } from '../screens/CreateRoomScreen'
import { LobbyScreen } from '../screens/LobbyScreen'
import { LetterDrawScreen } from '../screens/LetterDrawScreen'
import { RoundScreen } from '../screens/RoundScreen'
import { RoundEndScreen } from '../screens/RoundEndScreen'
import { ReviewScreen } from '../screens/ReviewScreen'
import { RoundResultScreen } from '../screens/RoundResultScreen'
import { GameOverScreen } from '../screens/GameOverScreen'
import { Modal } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { submitScore } from '../services/gameService'
import { scoreRound } from '../lib/scoring'

// Mantém o fluxo do jogo (as mesmas telas de antes). Cada tela continua com as props que já tinha.
export function GamePage() {
  const { user, isAuthenticated, setPendingScore } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [screen, setScreen] = useState(location.state?.start ?? 'join-room')
  const [room, setRoom] = useState(null)
  const [isOwner, setIsOwner] = useState(true)
  const [currentRound, setCurrentRound] = useState(1)
  const [usedLetters, setUsedLetters] = useState([])
  const [currentLetter, setCurrentLetter] = useState('B')
  const [instrOpen, setInstrOpen] = useState(false)
  const [roundAnswers, setRoundAnswers] = useState({})
  const [stopReason, setStopReason] = useState('stop')
  const [rounds, setRounds] = useState([]) // resultado de cada rodada: { round, letter, breakdown, total }
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | pending | error
  const [savedStats, setSavedStats] = useState(null)

  if (!user) return <Navigate to="/convidado" replace state={{ next: '/jogo', start: location.state?.start }} />

  const categories = room?.categories ?? ['Nome', 'Animal', 'Cidade', 'Cor', 'Fruta']
  const totalRounds = room?.totalRounds ?? 5
  const totalTime = room ? (room.difficulty === 'facil' ? 120 : room.difficulty === 'medio' ? 90 : 60) : 90
  const totalScore = rounds.reduce((sum, r) => sum + r.total, 0)
  const currentRoundResult = rounds.find(r => r.round === currentRound)

  function resetGame() {
    setCurrentRound(1)
    setUsedLetters([])
    setRounds([])
    setSaveState('idle')
    setSavedStats(null)
  }

  function handleJoinRoom(r) {
    setRoom(r)
    setIsOwner(false)
    resetGame()
    setScreen('lobby')
  }
  function handleCreateRoom(r) {
    setRoom(r)
    setIsOwner(true)
    resetGame()
    setScreen('lobby')
  }
  function startGame() {
    const letter = pickLetter(usedLetters)
    setCurrentLetter(letter)
    setUsedLetters(prev => [...prev, letter])
    setScreen('letter-draw')
  }
  function handleStop(answers, reason = 'stop') {
    setRoundAnswers(answers)
    setStopReason(reason)
    setScreen('round-end')
  }
  function handleReviewFinish() {
    const result = scoreRound(roundAnswers, categories, currentLetter)
    setRounds(prev => [...prev.filter(r => r.round !== currentRound), { round: currentRound, letter: currentLetter, ...result }])
    setScreen('round-result')
  }

  // Fim da partida: com conta, grava no Supabase; sem conta, guarda a pontuação em memória (Context)
  async function finishGame() {
    // "won" passa a valer quando houver outros jogadores reais na partida (tempo real)
    const summary = { points: totalScore, won: false, players: 1, rounds: totalRounds }
    if (!isAuthenticated) {
      setPendingScore(summary)
      setSaveState('pending')
      return
    }
    setSaveState('saving')
    try {
      const stats = await submitScore(summary)
      setSavedStats(stats)
      setSaveState('saved')
    } catch (err) {
      console.error(err)
      setSaveState('error')
    }
  }

  function handleNextRound() {
    if (currentRound >= totalRounds) {
      finishGame()
      setScreen('game-over')
    } else {
      const letter = pickLetter(usedLetters)
      setCurrentLetter(letter)
      setUsedLetters(prev => [...prev, letter])
      setCurrentRound(r => r + 1)
      setScreen('letter-draw')
    }
  }
  function handleNewGame() {
    resetGame()
    const letter = pickLetter([])
    setCurrentLetter(letter)
    setUsedLetters([letter])
    setScreen('letter-draw')
  }
  function handleLeave() {
    setRoom(null)
    navigate('/')
  }

  const players = [{ playerId: 'you', name: user.name, avatar: user.avatar, score: totalScore }]

  return (<>
    {screen === 'join-room' && (<JoinRoomScreen onBack={() => navigate('/')} onJoin={handleJoinRoom}/>)}

    {screen === 'create-room' && (<CreateRoomScreen onBack={() => navigate('/')} onCreated={handleCreateRoom} user={user}/>)}

    {screen === 'lobby' && room && (<LobbyScreen room={room} user={user} isOwner={isOwner} onStart={startGame} onLeave={handleLeave}/>)}

    {screen === 'letter-draw' && (<LetterDrawScreen currentRound={currentRound} totalRounds={totalRounds} letter={currentLetter} usedLetters={usedLetters} onComplete={() => setScreen('round')}/>)}

    {screen === 'round' && room && (<RoundScreen currentRound={currentRound} totalRounds={totalRounds} categories={categories} letter={currentLetter} usedLetters={usedLetters.slice(0, -1)} totalTime={totalTime} difficulty={room.difficulty} isOwner={isOwner} user={user} onLeave={handleLeave} onStop={handleStop} onInstructions={() => setInstrOpen(true)}/>)}

    {screen === 'round-end' && (<RoundEndScreen reason={stopReason} stoppedBy="Você" onComplete={() => setScreen('review')}/>)}

    {screen === 'review' && (<ReviewScreen currentRound={currentRound} totalRounds={totalRounds} letter={currentLetter} categories={categories} answers={roundAnswers} onBack={() => setScreen('round-end')} onFinish={handleReviewFinish}/>)}

    {screen === 'round-result' && (<RoundResultScreen currentRound={currentRound} totalRounds={totalRounds} letter={currentLetter} categories={categories} isLastRound={currentRound >= totalRounds} user={user} roundResult={currentRoundResult} totalScore={totalScore} onBack={() => setScreen('review')} onNext={handleNextRound}/>)}

    {screen === 'game-over' && (<GameOverScreen isOwner={isOwner} players={players} saveState={saveState} savedStats={savedStats} points={totalScore} onLogin={() => navigate('/login')} onRegister={() => navigate('/cadastro')} onRetrySave={finishGame} onBack={() => setScreen('round-result')} onNewGame={handleNewGame} onMenu={() => navigate('/')}/>)}

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
  </>)
}

function pickLetter(used) {
  const LETTERS = 'ABCDEFGHIJKLMNOPRSTV'
  const available = LETTERS.split('').filter(l => !used.includes(l))
  if (available.length === 0) return LETTERS[Math.floor(Math.random() * LETTERS.length)]
  return available[Math.floor(Math.random() * available.length)]
}