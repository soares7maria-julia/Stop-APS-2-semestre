import React, { useState } from 'react';
import { Screen, TopBar, Card, AvatarPicker, Input, Button, Badge } from '../components/ui';
import { MOCK_ACHIEVEMENTS, MOCK_MY_SCORES } from '../gameState';
export function ProfileScreen({ user, onBack, onUpdateUser }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar);
    const [tab, setTab] = useState('achievements');
    function save() {
        onUpdateUser({ ...user, name, avatar });
        setEditing(false);
    }
    const unlocked = MOCK_ACHIEVEMENTS.filter(a => a.unlocked).length;
    return (<Screen>
      <TopBar title="Meu Perfil" onBack={onBack}/>
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-8">

        {/* Profile card */}
        <Card className="p-6">
          {editing ? (<div className="space-y-4">
              <Input label="Nome de usuário" value={name} onChange={e => setName(e.target.value)}/>
              <div>
                <label className="text-sm font-600 text-[var(--muted-foreground)] block mb-2">Avatar</label>
                <div className="flex justify-center text-5xl mb-3">{avatar}</div>
                <AvatarPicker value={avatar} onChange={setAvatar}/>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={save}>Salvar</Button>
              </div>
            </div>) : (<div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-4xl flex-shrink-0">
                {user.avatar}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl text-[var(--foreground)]">{user.name}</h2>
                {!user.isGuest && (<div className="flex gap-4 mt-2">
                  <div><span className="font-700 text-[var(--primary)]">47</span> <span className="text-xs text-[var(--muted-foreground)]">partidas</span></div>
                  <div><span className="font-700 text-[var(--accent)]">12</span> <span className="text-xs text-[var(--muted-foreground)]">vitórias</span></div>
                  <div><span className="font-700 text-[var(--success)]">{unlocked}</span> <span className="text-xs text-[var(--muted-foreground)]">conquistas</span></div>
                </div>)}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>✏️ Editar</Button>
            </div>)}
        </Card>

        {!user.isGuest && (<>
          {/* Tabs */}
          <div className="flex bg-[var(--muted)] rounded-2xl p-1">
          {['achievements', 'history'].map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl font-700 text-sm cursor-pointer border-0 transition-all ${tab === t ? 'bg-[var(--card)] text-[var(--primary)] shadow-md' : 'text-[var(--muted-foreground)] bg-transparent'}`}>
              {t === 'achievements' ? `🏅 Conquistas (${unlocked}/${MOCK_ACHIEVEMENTS.length})` : '📋 Histórico'}
            </button>))}
          </div>

          {tab === 'achievements' ? (<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOCK_ACHIEVEMENTS.map(a => (<Card key={a.id} className={`p-4 text-center ${!a.unlocked ? 'opacity-50 grayscale' : ''}`}>
                <div className="text-3xl mb-2">{a.icon}</div>
                <div className={`font-700 text-sm ${a.unlocked ? 'text-[var(--card-foreground)]' : 'text-[var(--muted-foreground)]'}`}>{a.title}</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">{a.desc}</div>
                {a.unlocked && a.date && (<div className="mt-2">
                    <Badge color="success">✓ {a.date}</Badge>
                  </div>)}
                {!a.unlocked && (<div className="mt-2"><Badge color="muted">🔒 Bloqueada</Badge></div>)}
              </Card>))}
          </div>) : (<Card className="p-4">
            <div className="space-y-3">
              {MOCK_MY_SCORES.map((s, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--muted)]">
                  <span className="text-2xl">{s.avatar}</span>
                  <div className="flex-1">
                    <div className="font-700 text-[var(--card-foreground)]">{s.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{s.date} • {s.players} jogadores • {s.rounds} rodadas</div>
                  </div>
                  <div className="font-700 text-lg text-[var(--primary)]">{s.score} pts</div>
                </div>))}
            </div>
          </Card>)}
        </>)}
      </div>
    </Screen>);
}
