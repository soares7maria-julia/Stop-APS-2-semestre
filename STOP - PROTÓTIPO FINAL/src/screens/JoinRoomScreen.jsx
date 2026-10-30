import React, { useState } from 'react';
import { Screen, TopBar, Card, Button, Input, Badge, Modal } from '../components/ui';
import { MOCK_ROOMS, DIFFICULTY_CONFIG } from '../gameState';
export function JoinRoomScreen({ onBack, onJoin }) {
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordModal, setPasswordModal] = useState(null);
    const [codeError, setCodeError] = useState('');
    function handleCodeJoin(e) {
        e.preventDefault();
        const room = MOCK_ROOMS.find(r => r.code === code.toUpperCase());
        if (!room) {
            setCodeError('Sala não encontrada. Verifique o código.');
            return;
        }
        if (room.isPrivate) {
            setPasswordModal(room);
            return;
        }
        onJoin(room);
    }
    function handlePasswordJoin() {
        if (!passwordModal)
            return;
        if (password !== '1234') {
            return;
        }
        onJoin(passwordModal);
        setPasswordModal(null);
    }
    return (<Screen>
      <TopBar title="Entrar em uma Sala" onBack={onBack}/>
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6">

        {/* Code entry */}
        <Card className="p-5">
          <h2 className="text-xl mb-4 text-[var(--foreground)]">🔑 Entrar por Código</h2>
          <form onSubmit={handleCodeJoin} className="flex gap-3">
            <Input placeholder="Ex.: ABC123" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(''); }} error={codeError} className="flex-1 uppercase font-700 tracking-widest" maxLength={6}/>
            <Button type="submit" disabled={code.length < 3}>Entrar</Button>
          </form>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">Peça o código para o dono da sala</p>
        </Card>

        {/* Public rooms list */}
        <div>
          <h2 className="text-xl mb-3 text-[var(--foreground)]">🌐 Salas Públicas</h2>
          <div className="space-y-3">
            {MOCK_ROOMS.map(room => (<RoomCard key={room.id} room={room} onJoin={() => {
                if (room.isPrivate)
                    setPasswordModal(room);
                else
                    onJoin(room);
            }}/>))}
          </div>
        </div>
      </div>

      {/* Password modal */}
      <Modal open={!!passwordModal} onClose={() => setPasswordModal(null)} title="🔒 Sala Privada" size="sm">
        <div className="space-y-4">
          <p className="text-[var(--muted-foreground)] text-sm">Esta sala exige senha. Digite-a abaixo para entrar.</p>
          <Input label="Senha da sala" type="password" placeholder="Digite a senha..." value={password} onChange={e => setPassword(e.target.value)}/>
          <p className="text-xs text-[var(--muted-foreground)]">Dica: a senha desta sala de demonstração é <strong>1234</strong></p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setPasswordModal(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={handlePasswordJoin} disabled={!password}>Entrar</Button>
          </div>
        </div>
      </Modal>
    </Screen>);
}
function RoomCard({ room, onJoin }) {
    const diff = DIFFICULTY_CONFIG[room.difficulty];
    const isFull = room.players.length >= room.maxPlayers;
    const diffColors = { facil: 'success', medio: 'warning', dificil: 'danger' };
    return (<Card className="p-4 hover:border-[var(--primary)] transition-all cursor-pointer" onClick={!isFull ? onJoin : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-700 text-[var(--foreground)]">{room.name}</span>
            {room.isPrivate && <Badge color="muted">🔒 Privada</Badge>}
            <Badge color={diffColors[room.difficulty]}>{diff.label}</Badge>
          </div>
          <div className="text-xs text-[var(--muted-foreground)] space-y-0.5">
            <div>👥 {room.players.length}/{room.maxPlayers} jogadores • 🔄 {room.totalRounds} rodadas</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {room.categories.slice(0, 4).map(c => (<span key={c} className="bg-[var(--muted)] px-1.5 py-0.5 rounded-md text-[var(--muted-foreground)] text-xs">{c}</span>))}
              {room.categories.length > 4 && <span className="text-[var(--muted-foreground)] text-xs">+{room.categories.length - 4}</span>}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          {isFull ? (<Badge color="danger">Cheia</Badge>) : (<Button size="sm" onClick={e => { e.stopPropagation(); onJoin(); }}>
              {room.isPrivate ? '🔒 Entrar' : 'Entrar'}
            </Button>)}
        </div>
      </div>
    </Card>);
}
