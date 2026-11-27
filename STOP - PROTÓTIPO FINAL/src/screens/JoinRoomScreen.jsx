// Lista salas públicas em tempo real e permite entrar em uma sala usando seu código.
import React, { useEffect, useState } from 'react';
import { Screen, TopBar, Card, Button, Input, Badge, useToast, ToastContainer } from '../components/ui';
import { DIFFICULTY_CONFIG } from '../gameState';
import { listPublicRooms, subscribeToPublicRooms, joinRoomByCode } from '../services/roomService';
import { roomCodeSchema, validate } from '../lib/schemas';
import { traduzirErroSala } from '../lib/roomErrors';

export function JoinRoomScreen({ user, onBack, onJoin, onCreate }) {
    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [joining, setJoining] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [listState, setListState] = useState('loading'); // loading | ready | error
    const { toasts, add: addToast, remove: removeToast } = useToast();

    // Lista em tempo real: o Supabase avisa quando uma sala é criada, alterada ou excluída.
    // O recarregamento a cada 15s é só uma garantia caso o aviso se perca.
    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const data = await listPublicRooms();
                if (active) {
                    setRooms(data);
                    setListState('ready');
                }
            }
            catch (err) {
                console.error(err);
                if (active)
                    setListState(s => (s === 'ready' ? s : 'error'));
            }
        }
        load();
        const unsubscribe = subscribeToPublicRooms(load);
        const poll = setInterval(load, 15000);
        return () => {
            active = false;
            unsubscribe();
            clearInterval(poll);
        };
    }, []);

    async function join(roomCode) {
        setJoining(true);
        try {
            const room = await joinRoomByCode(roomCode, user);
            onJoin(room);
        }
        catch (err) {
            console.error(err);
            return traduzirErroSala(err);
        }
        finally {
            setJoining(false);
        }
    }

    async function handleCodeJoin(e) {
        e.preventDefault();
        setCodeError('');
        const result = validate(roomCodeSchema, { code });
        if (!result.data) {
            setCodeError(result.errors.code);
            return;
        }
        const message = await join(result.data.code.toUpperCase());
        if (message)
            setCodeError(message);
    }

    async function handleCardJoin(room) {
        const message = await join(room.code);
        if (message)
            addToast(message, 'error');
    }

    return (<Screen>
      <TopBar title="Entrar em uma Sala" onBack={onBack}/>
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6">

        {/* Code entry */}
        <Card className="p-5">
          <h2 className="text-xl mb-4 text-[var(--foreground)]">🔑 Entrar por Código</h2>
          <form onSubmit={handleCodeJoin} noValidate className="flex gap-3">
            <Input placeholder="Ex.: ABC123" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(''); }} error={codeError} className="flex-1 uppercase font-700 tracking-widest" maxLength={6}/>
            <Button type="submit" disabled={joining}>{joining ? 'Entrando...' : 'Entrar'}</Button>
          </form>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">Peça o código (ou o link de convite) para o dono da sala. Salas privadas só entram por aqui.</p>
        </Card>

        {/* Public rooms list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl text-[var(--foreground)]">🌐 Salas Públicas</h2>
            <span className="text-xs font-600 text-[var(--success)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"/> ao vivo
            </span>
          </div>

          {listState === 'loading' && (<Card className="p-6 text-center text-sm text-[var(--muted-foreground)]">Procurando salas...</Card>)}

          {listState === 'error' && (<Card className="p-6 text-center text-sm text-[var(--danger)]">
              Não foi possível carregar as salas. Tente novamente em instantes.
            </Card>)}

          {listState === 'ready' && rooms.length === 0 && (<Card className="p-8 text-center space-y-3">
              <div className="text-4xl">🔎</div>
              <p className="font-700 text-[var(--foreground)]">Nenhuma sala pública disponível no momento</p>
              <p className="text-sm text-[var(--muted-foreground)]">As salas aparecem aqui assim que alguém criar uma.</p>
              {onCreate && <Button variant="secondary" onClick={onCreate}>🏠 Criar uma sala</Button>}
            </Card>)}

          {listState === 'ready' && rooms.length > 0 && (<div className="space-y-3">
              {rooms.map(room => (<RoomCard key={room.id} room={room} disabled={joining} onJoin={() => handleCardJoin(room)}/>))}
            </div>)}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </Screen>);
}

function RoomCard({ room, disabled, onJoin }) {
    const diff = DIFFICULTY_CONFIG[room.difficulty];
    const count = room.playerCount ?? 0;
    const isFull = count >= room.maxPlayers;
    const diffColors = { facil: 'success', medio: 'warning', dificil: 'danger' };
    return (<Card className="p-4 hover:border-[var(--primary)] transition-all cursor-pointer" onClick={!isFull && !disabled ? onJoin : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-700 text-[var(--foreground)]">{room.name}</span>
            {diff && <Badge color={diffColors[room.difficulty]}>{diff.label}</Badge>}
          </div>
          <div className="text-xs text-[var(--muted-foreground)] space-y-0.5">
            <div>👥 {count}/{room.maxPlayers} jogadores • 🔄 {room.totalRounds} rodadas</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {room.categories.slice(0, 4).map(c => (<span key={c} className="bg-[var(--muted)] px-1.5 py-0.5 rounded-md text-[var(--muted-foreground)] text-xs">{c}</span>))}
              {room.categories.length > 4 && <span className="text-[var(--muted-foreground)] text-xs">+{room.categories.length - 4}</span>}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          {isFull ? (<Badge color="danger">Cheia</Badge>) : (<Button size="sm" disabled={disabled} onClick={e => { e.stopPropagation(); onJoin(); }}>
              Entrar
            </Button>)}
        </div>
      </div>
    </Card>);
}