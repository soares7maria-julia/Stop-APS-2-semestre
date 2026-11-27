// Mostra jogadores e estado da sala, com prontidão, convite, chat e início da partida.
import React, { useState, useEffect, useRef } from 'react';
import { Screen, TopBar, Card, Button, PlayerCard, Modal, useToast, ToastContainer } from '../components/ui';
import { getRoomPlayers, findRoomByCode, subscribeToRoom, touchRoom, setReady as saveReady, startRoom, leaveRoom, joinRoomChat, buildInviteLink } from '../services/roomService';

const nowTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function LobbyScreen({ room, user, isOwner, onStart, onRoomStarted, onLeave }) {
    const [players, setPlayers] = useState([]);
    const [roomStatus, setRoomStatus] = useState(room.status ?? 'waiting');
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [leaveModal, setLeaveModal] = useState(false);
    const [inviteModal, setInviteModal] = useState(false);
    const [starting, setStarting] = useState(false);
    const { toasts, add: addToast, remove: removeToast } = useToast();
    const chatBoxRef = useRef(null);
    const chatRef = useRef(null);
    const joinedRef = useRef(false);
    const closedRef = useRef(false);
    const latest = useRef({});
    latest.current = { onLeave, onRoomStarted, addToast };

    // Jogadores e estado da sala em tempo real (com recarga a cada 10s como garantia) + "sala viva"
    useEffect(() => {
        let active = true;
        function close(message) {
            closedRef.current = true;
            latest.current.addToast(message, 'error');
            setTimeout(() => latest.current.onLeave(), 1500);
        }
        async function refresh() {
            try {
                const [rows, current] = await Promise.all([getRoomPlayers(room.id), findRoomByCode(room.code)]);
                if (!active || closedRef.current)
                    return;
                const me = rows.some(p => p.player_id === user.id);
                if (me)
                    joinedRef.current = true;
                if (!current) {
                    close('A sala foi encerrada.');
                    return;
                }
                if (!me && joinedRef.current) {
                    close('Você foi removido da sala.');
                    return;
                }
                setPlayers(rows);
                setRoomStatus(current.status);
                if (current.status === 'playing' && !isOwner)
                    latest.current.onRoomStarted?.();
            }
            catch (err) {
                console.error(err);
            }
        }
        refresh();
        touchRoom(room.id).catch(console.error);
        const unsubscribe = subscribeToRoom(room.id, refresh);
        const poll = setInterval(refresh, 10000);
        const heartbeat = setInterval(() => touchRoom(room.id).catch(console.error), 60000);
        return () => {
            active = false;
            unsubscribe();
            clearInterval(poll);
            clearInterval(heartbeat);
        };
    }, [room.id, room.code, user.id, isOwner]);

    // Chat em tempo real (mensagens não são gravadas no banco)
    useEffect(() => {
        const chat = joinRoomChat(room.id, msg => setMessages(prev => [...prev, msg].slice(-100)));
        chatRef.current = chat;
        return () => chat.leave();
    }, [room.id]);

    useEffect(() => {
        if (chatBoxRef.current)
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }, [messages]);

    const view = players.map(p => {
        const owner = p.player_id === room.ownerId;
        return { ...p, isOwner: owner, status: owner || p.is_ready ? 'pronto' : 'aguardando' };
    });
    const me = view.find(p => p.player_id === user.id);
    const ready = !!me?.is_ready;
    const others = view.filter(p => !p.isOwner);
    const allReady = others.every(p => p.status === 'pronto');
    const readyCount = view.filter(p => p.status === 'pronto').length;
    const inviteLink = buildInviteLink(room.code);
    const started = roomStatus === 'playing';

    async function toggleReady() {
        const next = !ready;
        setPlayers(prev => prev.map(p => (p.player_id === user.id ? { ...p, is_ready: next } : p)));
        try {
            await saveReady(room.id, user.id, next);
            addToast(next ? '✅ Você está pronto!' : '⏳ Aguardando...', next ? 'success' : 'info');
        }
        catch (err) {
            console.error(err);
            setPlayers(prev => prev.map(p => (p.player_id === user.id ? { ...p, is_ready: !next } : p)));
            addToast('Não foi possível atualizar. Tente novamente.', 'error');
        }
    }

    async function kickPlayer(player) {
        try {
            await leaveRoom(room.id, player.player_id);
            setPlayers(prev => prev.filter(p => p.player_id !== player.player_id));
            addToast(`${player.username} foi removido da sala.`, 'info');
        }
        catch (err) {
            console.error(err);
            addToast('Não foi possível remover o jogador.', 'error');
        }
    }

    async function handleStart() {
        setStarting(true);
        try {
            await startRoom(room.id);
            onStart(view.map(p => ({ id: p.player_id, name: p.username, avatar: p.avatar, isOwner: p.isOwner })));
        }
        catch (err) {
            console.error(err);
            addToast('Não foi possível iniciar a partida.', 'error');
            setStarting(false);
        }
    }

    function confirmLeave() {
        closedRef.current = true; // evita o aviso "sala encerrada" no próprio dono
        onLeave();
    }

    function sendChat(e) {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text)
            return;
        chatRef.current?.send({ id: crypto.randomUUID(), userId: user.id, from: user.name, avatar: user.avatar, text: text.slice(0, 100), time: nowTime() });
        setChatInput('');
    }

    return (<Screen>
      <TopBar title={room.name} subtitle={`${room.isPrivate ? '🔒 Privada • ' : ''}Código: ${room.code} • ${room.difficulty === 'facil' ? '😊 Fácil' : room.difficulty === 'medio' ? '😐 Médio' : '😤 Difícil'}`} onBack={() => setLeaveModal(true)} rightSlot={<Button variant="ghost" size="sm" onClick={() => setInviteModal(true)}>
            🔗 Convidar
          </Button>}/>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Main area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Status banner */}
          {started && !isOwner ? (<div className="bg-[var(--warning)]/15 border border-[var(--warning)]/40 rounded-2xl p-4">
              <div className="font-700 text-[var(--foreground)]">🎮 Partida iniciada</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Sincronizando a rodada com o dono...</div>
            </div>) : (<div className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-pulse"/>
              <div>
                <div className="font-700 text-[var(--primary)]">⏳ Aguardando jogadores</div>
                <div className="text-xs text-[var(--muted-foreground)]">{readyCount}/{view.length} prontos • {Math.max(room.maxPlayers - view.length, 0)} vagas restantes</div>
              </div>
            </div>)}

          {/* Players */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-700 text-[var(--foreground)]">👥 Jogadores ({view.length}/{room.maxPlayers})</h2>
              <div className="h-2 w-24 bg-[var(--muted)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--success)] rounded-full transition-all" style={{ width: `${view.length ? (readyCount / view.length) * 100 : 0}%` }}/>
              </div>
            </div>
            <div className="space-y-2">
              {view.length === 0 && <p className="text-sm text-[var(--muted-foreground)] text-center py-3">Carregando jogadores...</p>}
              {view.map(p => (<PlayerCard key={p.player_id} name={p.username} avatar={p.avatar} status={p.status} isOwner={p.isOwner} isYou={p.player_id === user.id} onKick={isOwner && p.player_id !== user.id ? () => kickPlayer(p) : undefined}/>))}
            </div>
          </Card>

          {/* Room info chips */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="bg-[var(--muted)] px-3 py-1.5 rounded-full font-600 text-[var(--muted-foreground)]">🔄 {room.totalRounds} rodadas</span>
            {room.categories.map(c => (<span key={c} className="bg-[var(--secondary)] px-3 py-1.5 rounded-full font-600 text-[var(--secondary-foreground)]">{c}</span>))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            {isOwner ? (<>
                <Button size="xl" className="w-full" disabled={!allReady || starting || view.length < 2} onClick={handleStart}>
                  {starting ? 'Iniciando...' : view.length < 2 ? '👥 Convide pelo menos mais 1 jogador' : allReady ? '🚀 Iniciar Partida!' : `⏳ Aguardando prontos (${readyCount}/${view.length})`}
                </Button>
                <Button variant="danger" size="md" className="w-full" onClick={() => setLeaveModal(true)}>
                  🗑️ Excluir sala
                </Button>
              </>) : (<>
                <Button size="xl" variant={ready ? 'secondary' : 'primary'} className="w-full" onClick={toggleReady} disabled={started}>
                  {ready ? '✅ Pronto! (clique para desfazer)' : '👍 Estou Pronto!'}
                </Button>
                <Button variant="danger" size="md" className="w-full" onClick={() => setLeaveModal(true)}>
                  🚪 Sair da Sala
                </Button>
              </>)}
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border)] flex flex-col" style={{ height: '320px', maxHeight: '320px' }}>
          <div className="px-4 py-3 border-b border-[var(--border)] font-700 text-[var(--foreground)] text-sm flex items-center gap-2">
            💬 Chat da Sala
          </div>
          <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && <p className="text-xs text-[var(--muted-foreground)] text-center mt-4">Nenhuma mensagem ainda. Diga oi! 👋</p>}
            {messages.map(m => {
                const mine = m.userId === user.id;
                return (<div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                <span className="text-lg flex-shrink-0 mt-1">{m.avatar}</span>
                <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!mine && <span className="text-xs text-[var(--muted-foreground)] font-600 mb-0.5">{m.from}</span>}
                  <div className={`px-3 py-2 rounded-2xl text-sm font-500 ${mine ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--card-foreground)]'}`}>
                    {m.text}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] mt-0.5">{m.time}</span>
                </div>
              </div>);
            })}
          </div>
          <form onSubmit={sendChat} className="p-3 border-t border-[var(--border)] flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Mensagem..." className="flex-1 px-3 py-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]" maxLength={100}/>
            <button type="submit" className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center cursor-pointer border-0 font-700">→</button>
          </form>
        </div>
      </div>

      {/* Leave / delete modal */}
      <Modal open={leaveModal} onClose={() => setLeaveModal(false)} title={isOwner ? 'Excluir a sala?' : 'Sair da Sala?'} size="sm">
        <div className="space-y-4">
          <p className="text-[var(--muted-foreground)]">
            {isOwner ? 'A sala será excluída para todos os jogadores. Essa ação não pode ser desfeita.' : 'Tem certeza que deseja sair desta sala?'}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setLeaveModal(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={confirmLeave}>{isOwner ? 'Excluir sala' : 'Sair'}</Button>
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
