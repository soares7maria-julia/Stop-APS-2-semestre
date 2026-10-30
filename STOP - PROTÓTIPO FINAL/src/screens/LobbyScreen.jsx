import React, { useState, useEffect, useRef } from 'react';
import { Screen, TopBar, Card, Button, PlayerCard, Modal } from '../components/ui';
import { MOCK_LOBBY_PLAYERS } from '../gameState';
import { useToast, ToastContainer } from '../components/ui';
const MOCK_MSGS = [
    { id: '1', from: 'Ana Lima', avatar: '🐼', text: 'Oi! Animada para jogar 🎉', time: '10:30' },
    { id: '2', from: 'Carlos Neto', avatar: '🐸', text: 'Pronto aqui!', time: '10:31' },
    { id: '3', from: 'Sistema', avatar: '🤖', text: 'Mariana Costa entrou na sala.', time: '10:32' },
];
export function LobbyScreen({ room, user, isOwner, onStart, onLeave }) {
    const [players, setPlayers] = useState(MOCK_LOBBY_PLAYERS.map(p => p.id === 'you' ? { ...p, name: user.name, avatar: user.avatar, isOwner, status: isOwner ? 'pronto' : p.status } : p));
    const [ready, setReady] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState(MOCK_MSGS);
    const [leaveModal, setLeaveModal] = useState(false);
    const [inviteModal, setInviteModal] = useState(false);
    const { toasts, add: addToast, remove: removeToast } = useToast();
    const chatRef = useRef(null);
    useEffect(() => {
        // Simulate a player becoming ready after 3s
        const timer = setTimeout(() => {
            setPlayers(prev => prev.map(p => p.id === 'p3' ? { ...p, status: 'pronto' } : p));
            setMessages(prev => [...prev, { id: Date.now().toString(), from: 'Sistema', avatar: '🤖', text: 'Carlos Neto está pronto!', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }]);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);
    useEffect(() => {
        if (chatRef.current)
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);
    function toggleReady() {
        setReady(r => !r);
        setPlayers(prev => prev.map(p => p.id === 'you' ? { ...p, status: ready ? 'aguardando' : 'pronto' } : p));
        addToast(!ready ? '✅ Você está pronto!' : '⏳ Aguardando...', !ready ? 'success' : 'info');
    }
    function kickPlayer(id) {
        setPlayers(prev => prev.filter(p => p.id !== id));
        addToast('Jogador removido da sala.', 'info');
    }
    function sendChat(e) {
        e.preventDefault();
        if (!chatInput.trim())
            return;
        setMessages(prev => [...prev, {
                id: Date.now().toString(),
                from: 'Você',
                avatar: user.avatar,
                text: chatInput.trim(),
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }]);
        setChatInput('');
    }
    const allReady = players.every(p => p.status === 'pronto');
    const readyCount = players.filter(p => p.status === 'pronto').length;
    const inviteLink = `https://stop.jogo/sala/${room.code}`;
    return (<Screen>
      <TopBar title={room.name} subtitle={`Código: ${room.code} • ${room.difficulty === 'facil' ? '😊 Fácil' : room.difficulty === 'medio' ? '😐 Médio' : '😤 Difícil'}`} onBack={() => setLeaveModal(true)} rightSlot={<Button variant="ghost" size="sm" onClick={() => setInviteModal(true)}>
            🔗 Convidar
          </Button>}/>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Main area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Status banner */}
          <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-pulse"/>
            <div>
              <div className="font-700 text-[var(--primary)]">⏳ Aguardando jogadores</div>
              <div className="text-xs text-[var(--muted-foreground)]">{readyCount}/{players.length} prontos • {room.maxPlayers - players.length} vagas restantes</div>
            </div>
          </div>

          {/* Players */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-700 text-[var(--foreground)]">👥 Jogadores ({players.length}/{room.maxPlayers})</h2>
              <div className="h-2 w-24 bg-[var(--muted)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--success)] rounded-full transition-all" style={{ width: `${(readyCount / players.length) * 100}%` }}/>
              </div>
            </div>
            <div className="space-y-2">
              {players.map(p => (<PlayerCard key={p.id} name={p.name} avatar={p.avatar} status={p.status} isOwner={p.isOwner} isYou={p.id === 'you'} onKick={isOwner && p.id !== 'you' ? () => kickPlayer(p.id) : undefined}/>))}
            </div>
          </Card>

          {/* Room info chips */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="bg-[var(--muted)] px-3 py-1.5 rounded-full font-600 text-[var(--muted-foreground)]">🔄 {room.totalRounds} rodadas</span>
            {room.categories.map(c => (<span key={c} className="bg-[var(--secondary)] px-3 py-1.5 rounded-full font-600 text-[var(--secondary-foreground)]">{c}</span>))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            {isOwner ? (<Button size="xl" className="w-full" disabled={!allReady || players.length < 2} onClick={onStart}>
                {allReady ? '🚀 Iniciar Partida!' : `⏳ Aguardando prontos (${readyCount}/${players.length})`}
              </Button>) : (<Button size="xl" variant={ready ? 'secondary' : 'primary'} className="w-full" onClick={toggleReady}>
                {ready ? '✅ Pronto! (clique para desfazer)' : '👍 Estou Pronto!'}
              </Button>)}
            <Button variant="danger" size="md" className="w-full" onClick={() => setLeaveModal(true)}>
              🚪 Sair da Sala
            </Button>
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border)] flex flex-col" style={{ height: '320px', maxHeight: '320px' }}>
          <div className="px-4 py-3 border-b border-[var(--border)] font-700 text-[var(--foreground)] text-sm flex items-center gap-2">
            💬 Chat da Sala
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map(m => (<div key={m.id} className={`flex gap-2 ${m.from === 'Você' ? 'flex-row-reverse' : ''}`}>
                <span className="text-lg flex-shrink-0 mt-1">{m.avatar}</span>
                <div className={`max-w-[75%] ${m.from === 'Você' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {m.from !== 'Você' && <span className="text-xs text-[var(--muted-foreground)] font-600 mb-0.5">{m.from}</span>}
                  <div className={`px-3 py-2 rounded-2xl text-sm font-500 ${m.from === 'Sistema'
                ? 'bg-[var(--muted)] text-[var(--muted-foreground)] italic text-xs'
                : m.from === 'Você'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--card-foreground)]'}`}>
                    {m.text}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] mt-0.5">{m.time}</span>
                </div>
              </div>))}
          </div>
          <form onSubmit={sendChat} className="p-3 border-t border-[var(--border)] flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Mensagem..." className="flex-1 px-3 py-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]" maxLength={100}/>
            <button type="submit" className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center cursor-pointer border-0 font-700">→</button>
          </form>
        </div>
      </div>

      {/* Leave modal */}
      <Modal open={leaveModal} onClose={() => setLeaveModal(false)} title="Sair da Sala?" size="sm">
        <div className="space-y-4">
          <p className="text-[var(--muted-foreground)]">
            {isOwner ? 'Como dono da sala, sair vai encerrá-la para todos os jogadores.' : 'Tem certeza que deseja sair desta sala?'}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setLeaveModal(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={onLeave}>Sair</Button>
          </div>
        </div>
      </Modal>

      {/* Invite modal */}
      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="🔗 Convidar Amigos" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-600 text-[var(--muted-foreground)] block mb-1">Código da sala</label>
            <div className="flex items-center gap-3 bg-[var(--muted)] rounded-2xl p-4">
              <span className="flex-1 font-700 text-2xl text-[var(--primary)] tracking-widest">{room.code}</span>
              <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(room.code); addToast('Código copiado!', 'success'); }}>Copiar</Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-600 text-[var(--muted-foreground)] block mb-1">Link de convite</label>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteLink} className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)]"/>
              <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(inviteLink); addToast('Link copiado!', 'success'); }}>📋</Button>
            </div>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </Screen>);
}
