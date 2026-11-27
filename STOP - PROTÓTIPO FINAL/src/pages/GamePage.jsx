// Coordena salas, rodadas, respostas, resultados, comunicação em tempo real e gravação da pontuação.
import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { JoinRoomScreen } from '../screens/JoinRoomScreen'
import { CreateRoomScreen } from '../screens/CreateRoomScreen'
import { LobbyScreen } from '../screens/LobbyScreen'
import { LetterDrawScreen } from '../screens/LetterDrawScreen'
import { RoundScreen } from '../screens/RoundScreen'
import { RoundEndScreen } from '../screens/RoundEndScreen'
import { RoundResultScreen } from '../screens/RoundResultScreen'
import { GameOverScreen } from '../screens/GameOverScreen'
import { Modal } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { submitScore } from '../services/gameService'
import { deleteRoom, leaveRoom, joinRoomGame } from '../services/roomService'
import { scoreRound, normalizeText } from '../lib/scoring'
import { playGameSound } from '../lib/audio'

// Fluxo do jogo: salas (reais, no Supabase) e rodadas.
// Quem chega pelo link de convite já vem com a sala em location.state.room.
export function GamePage() {
  const { user, isAuthenticated, setPendingScore } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initialRoom = location.state?.room ?? null

  const [screen, setScreen] = useState(initialRoom ? 'lobby' : (location.state?.start ?? 'join-room'))
  const [room, setRoom] = useState(initialRoom)
  const [isOwner, setIsOwner] = useState(!!initialRoom && !!user && initialRoom.ownerId === user.id)
  const [roomPlayers, setRoomPlayers] = useState([])
  const [currentRound, setCurrentRound] = useState(1)
  const [usedLetters, setUsedLetters] = useState([])
  const [currentLetter, setCurrentLetter] = useState('B')
  const [instrOpen, setInstrOpen] = useState(false)
  const [roundAnswers, setRoundAnswers] = useState({})
  const [stopReason, setStopReason] = useState('stop')
  const [stoppedBy, setStoppedBy] = useState('Você')
  const [stopSignal, setStopSignal] = useState(null)
  const [rounds, setRounds] = useState([]) // resultado de cada rodada: { round, letter, breakdown, total }
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | pending | error
  const [savedStats, setSavedStats] = useState(null)
  const [gameResults, setGameResults] = useState([])
  const [roundPublished, setRoundPublished] = useState(false)
  const [gameChannelStatus, setGameChannelStatus] = useState('CONNECTING')
  const gameChannel = useRef(null)
  const currentRoundRef = useRef(currentRound)
  currentRoundRef.current = currentRound
  const finishGameRef = useRef(null)
  const receivedStop = useRef(false)
  const receivedStartId = useRef(null)
  const previousScreen = useRef(screen)

  useEffect(() => {
    if (screen !== previousScreen.current) {
      if (screen === 'letter-draw') playGameSound('reveal')
      if (screen === 'round-end') playGameSound('stop')
      if (screen === 'game-over') {
        const top = Math.max(...gameResults.map(player => player.totalScore ?? player.score ?? 0), 0)
        playGameSound(gameResults.some(player => player.playerId === user?.id && (player.totalScore ?? player.score) === top) ? 'victory' : 'failure')
      }
      previousScreen.current = screen
    }
  }, [screen, gameResults, user?.id])

  useEffect(() => {
    if (!room?.id) return
    const channel = joinRoomGame(room.id, event => {
      if (!event || event.playerId === user?.id) return
      if (event.type === 'start' && !isOwner && receivedStartId.current !== event.eventId) {
        receivedStartId.current = event.eventId
        receivedStop.current = false; setRoundAnswers({}); setStopSignal(null); setRoundPublished(false)
        setRoomPlayers(event.players); setCurrentRound(1); setUsedLetters([event.letter]); setCurrentLetter(event.letter); setScreen('letter-draw')
      }
      if (event.type === 'round' && !isOwner) {
        receivedStop.current = false; setRoundAnswers({}); setStopSignal(null); setRoundPublished(false); setCurrentRound(event.round); setCurrentLetter(event.letter); setUsedLetters(event.usedLetters); setScreen('letter-draw')
      }
      if (event.type === 'answers' && event.round === currentRoundRef.current) {
        setRoundAnswers(prev => ({ ...prev, [event.playerId]: event.answers }))
      }
      if (event.type === 'stop' && event.round === currentRoundRef.current && !receivedStop.current) {
        receivedStop.current = true
        setStopReason(event.reason)
        setStoppedBy(event.stoppedBy ?? 'Outro jogador')
        setStopSignal({ reason: event.reason, stoppedBy: event.stoppedBy ?? 'Outro jogador', id: `${event.round}-${Date.now()}` })
      }
      if (event.type === 'result' && event.round === currentRoundRef.current) {
        const personalResult = event.personalRoundResults?.[user?.id]
        if (event.answers) setRoundAnswers(event.answers)
        setRounds(prev => [...prev.filter(r => r.round !== event.round), personalResult ?? event.rounds.at(-1)])
        setGameResults(event.players); setRoundPublished(true); setScreen('round-result')
      }
      if (event.type === 'game-over') { setGameResults(event.players); setScreen('game-over'); if (!isOwner) setTimeout(() => finishGameRef.current?.(), 0) }
    }, setGameChannelStatus)
    gameChannel.current = channel
    return () => { channel.leave(); gameChannel.current = null }
  }, [room?.id, user?.id, isOwner])

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
    setRoundPublished(false)
    setSaveState('idle')
    setSavedStats(null)
  }

  // Vale para sala criada e para sala em que se entrou
  function enterRoom(r) {
    setRoom(r)
    setIsOwner(r.ownerId === user.id)
    resetGame()
    setScreen('lobby')
  }
  function startGame(list) {
    if (!isOwner || list.length < 2) return
    setRoomPlayers(list)
    const letter = pickLetter([])
    setCurrentLetter(letter)
    setUsedLetters([letter])
    setRoundAnswers({})
    setRoundPublished(false)
    setStopSignal(null)
    receivedStop.current = false
    setScreen('letter-draw')
    const startEvent = { type: 'start', eventId: crypto.randomUUID(), playerId: user.id, players: list, round: 1, letter }
    gameChannel.current?.send(startEvent)
    // Reenvia por alguns segundos para incluir jogadores cujo WebSocket ainda está conectando.
    ;[500, 1000, 2000, 4000, 8000, 12000, 16000].forEach(delay => setTimeout(() => gameChannel.current?.send(startEvent), delay))
  }
  function handleStop(answers, reason = 'stop') {
    setRoundAnswers(prev => ({ ...prev, [user.id]: answers }))
    setStopReason(reason)
    setStoppedBy(receivedStop.current && stopSignal ? stopSignal.stoppedBy : user.name)
    gameChannel.current?.send({ type: 'answers', playerId: user.id, round: currentRound, answers })
    if (!receivedStop.current) {
      receivedStop.current = true
      gameChannel.current?.send({ type: 'stop', playerId: user.id, round: currentRound, reason, stoppedBy: user.name })
    }
    setScreen('round-end')
  }
  function publishRoundResult() {
    let result = scoreRound(roundAnswers, categories, currentLetter)
    let nextRounds
    if (isOwner) {
      const submissions = { ...roundAnswers, [user.id]: roundAnswers?.[user.id] ?? roundAnswers }
      const personalRoundResults = {}
      const players = roomPlayers.map(player => {
        const breakdown = {}
        const roundScore = categories.reduce((sum, category) => {
          const answer = submissions[player.id]?.[category]
          const scored = scoreRound({ [category]: answer }, [category], currentLetter).total
          if (!scored) { breakdown[category] = 0; return sum }
          const duplicate = roomPlayers.some(other => other.id !== player.id && normalizeText(submissions[other.id]?.[category] ?? '') === normalizeText(answer ?? ''))
          const points = duplicate ? 5 : 10
          breakdown[category] = points
          return sum + points
        }, 0)
        const previous = gameResults.find(p => p.playerId === player.id)?.totalScore ?? 0
        personalRoundResults[player.id] = { round: currentRound, letter: currentLetter, breakdown, total: roundScore }
        return { playerId: player.id, name: player.name, avatar: player.avatar, roundScore, totalScore: previous + roundScore }
      })
      result = personalRoundResults[user.id] ?? result
      nextRounds = [...rounds.filter(r => r.round !== currentRound), result]
      gameChannel.current?.send({ type: 'result', playerId: user.id, round: currentRound, rounds: nextRounds, personalRoundResults, players, answers: submissions })
      setGameResults(players)
      setRoundPublished(true)
    }
    if (!nextRounds) nextRounds = [...rounds.filter(r => r.round !== currentRound), { round: currentRound, letter: currentLetter, ...result }]
    setRounds(nextRounds)
    setScreen('round-result')
  }

  // Fim da partida: com conta, grava no Supabase; sem conta, guarda a pontuação em memória (Context)
  async function finishGame() {
    // "won" passa a valer quando houver outros jogadores jogando a mesma rodada
    const top = Math.max(...gameResults.map(p => p.totalScore ?? p.score ?? 0), totalScore)
    const summary = { points: totalScore, won: totalScore === top && gameResults.length > 1, players: roomPlayers.length || 1, rounds: totalRounds }
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
  finishGameRef.current = finishGame

  function handleNextRound() {
    if (currentRound >= totalRounds) {
      if (isOwner) gameChannel.current?.send({ type: 'game-over', playerId: user.id, players: gameResults })
      finishGame()
      setScreen('game-over')
    } else {
      receivedStop.current = false
      setRoundAnswers({})
      setStopSignal(null)
      setRoundPublished(false)
      const letter = pickLetter(usedLetters)
      setCurrentLetter(letter)
      setUsedLetters(prev => [...prev, letter])
      setCurrentRound(r => r + 1)
      setScreen('letter-draw')
      if (isOwner) gameChannel.current?.send({ type: 'round', playerId: user.id, round: currentRound + 1, letter, usedLetters: [...usedLetters, letter] })
    }
  }
  function handleNewGame() {
    resetGame()
    const letter = pickLetter([])
    setCurrentLetter(letter)
    setUsedLetters([letter])
    setScreen('letter-draw')
  }

  // Sair: o dono exclui a sala; quem não é dono apenas sai dela
  async function handleLeave() {
    try {
      if (room) {
        if (isOwner) await deleteRoom(room.id)
        else await leaveRoom(room.id, user.id)
      }
    } catch (err) {
      console.error(err)
    }
    setRoom(null)
    navigate('/')
  }

  const players = gameResults.length ? gameResults.map(p => ({ ...p, score: p.totalScore ?? p.score })) : [{ playerId: user.id, name: user.name, avatar: user.avatar, score: totalScore }]

  return (<>
    {screen === 'join-room' && (<JoinRoomScreen user={user} onBack={() => navigate('/')} onJoin={enterRoom} onCreate={() => setScreen('create-room')}/>)}

    {screen === 'create-room' && (<CreateRoomScreen onBack={() => navigate('/')} onCreated={enterRoom} user={user}/>)}

    {screen === 'lobby' && room && (<LobbyScreen room={room} user={user} isOwner={isOwner} onStart={startGame} onRoomStarted={() => setScreen('connecting')} onLeave={handleLeave}/>)}

    {screen === 'connecting' && (<div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-md text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-xl">
        <div className="text-5xl mb-4">🎮</div>
        <h1 className="text-2xl font-700 text-[var(--foreground)]">O dono iniciou a partida</h1>
        <p className="mt-3 text-[var(--muted-foreground)]">Conectando ao canal da sala para receber a letra e começar a rodada…</p>
        <div className="mt-5 text-sm font-600 text-[var(--primary)]">{gameChannelStatus === 'SUBSCRIBED' ? 'Conectado · aguardando sincronização' : 'Conectando ao Supabase Realtime…'}</div>
        {['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(gameChannelStatus) && <p className="mt-3 text-sm text-[var(--danger)]">A conexão em tempo real falhou ({gameChannelStatus}). Recarregue a página para tentar novamente.</p>}
      </div>
    </div>)}

    {screen === 'letter-draw' && (<LetterDrawScreen currentRound={currentRound} totalRounds={totalRounds} letter={currentLetter} usedLetters={usedLetters} onComplete={() => setScreen('round')}/>)}

    {screen === 'round' && (<RoundScreen currentRound={currentRound} totalRounds={totalRounds} categories={categories} letter={currentLetter} usedLetters={usedLetters.slice(0, -1)} totalTime={totalTime} difficulty={room?.difficulty ?? 'medio'} isOwner={isOwner} user={user} players={roomPlayers} stopSignal={stopSignal} onLeave={handleLeave} onStop={handleStop} onInstructions={() => setInstrOpen(true)}/>)}

    {screen === 'round-end' && (<RoundEndScreen reason={stopReason} stoppedBy={stoppedBy} onComplete={() => setScreen('round-result')}/>)}

    {screen === 'round-result' && (<RoundResultScreen currentRound={currentRound} totalRounds={totalRounds} letter={currentLetter} categories={categories} isLastRound={currentRound >= totalRounds} user={user} isOwner={isOwner} isPublished={roundPublished} allSubmitted={roomPlayers.every(player => !!roundAnswers[player.id])} players={gameResults} roomPlayers={roomPlayers} answers={roundAnswers} roundResult={currentRoundResult} totalScore={totalScore} onPublish={publishRoundResult} onNext={handleNextRound}/>)}

    {screen === 'game-over' && (<GameOverScreen isOwner={isOwner} players={players} saveState={saveState} savedStats={savedStats} points={totalScore} onLogin={() => navigate('/login')} onRegister={() => navigate('/cadastro')} onRetrySave={finishGame} onBack={() => setScreen('round-result')} onNewGame={handleNewGame} onMenu={handleLeave}/>)}

    <Modal open={instrOpen} onClose={() => setInstrOpen(false)} title="📖 Como Jogar" size="md">
      <div className="space-y-4 text-[var(--card-foreground)]">
        <p className="text-sm text-[var(--muted-foreground)]">
          Uma letra é sorteada a cada rodada. Preencha uma palavra começando com ela para cada categoria. Quando terminar, pressione <strong>STOP!</strong> para encerrar a rodada.
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
