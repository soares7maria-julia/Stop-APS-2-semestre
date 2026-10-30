import React, { useState } from 'react';
import { Screen, TopBar, Card, Button, Input, Toggle, Select, CategoryChip } from '../components/ui';
import { DEFAULT_CATEGORIES, DIFFICULTY_CONFIG } from '../gameState';
export function CreateRoomScreen({ onBack, onCreated, user }) {
    const [roomName, setRoomName] = useState(`Sala de ${user.name}`);
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [maxPlayers, setMaxPlayers] = useState('6');
    const [difficulty, setDifficulty] = useState('medio');
    const [totalRounds, setTotalRounds] = useState('5');
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES.slice(0, 5));
    const [newCat, setNewCat] = useState('');
    function addCategory() {
        const cat = newCat.trim();
        if (!cat || categories.includes(cat))
            return;
        setCategories(prev => [...prev, cat]);
        setNewCat('');
    }
    function removeCategory(cat) {
        if (categories.length <= 2)
            return;
        setCategories(prev => prev.filter(c => c !== cat));
    }
    function addDefault(cat) {
        if (!categories.includes(cat))
            setCategories(prev => [...prev, cat]);
    }
    function handleCreate() {
        const room = {
            id: Math.random().toString(36).slice(2),
            name: roomName || `Sala de ${user.name}`,
            code: Math.random().toString(36).slice(2, 8).toUpperCase(),
            isPrivate,
            password: isPrivate ? password : undefined,
            maxPlayers: parseInt(maxPlayers),
            difficulty,
            totalRounds: parseInt(totalRounds),
            categories,
            players: [{ id: 'you', name: user.name, avatar: user.avatar, isOwner: true, status: 'aguardando', score: 0 }],
            status: 'aguardando',
        };
        onCreated(room);
    }
    const diff = DIFFICULTY_CONFIG[difficulty];
    const available = DEFAULT_CATEGORIES.filter(c => !categories.includes(c));
    return (<Screen>
      <TopBar title="Criar Sala" onBack={onBack}/>
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-8">

        {/* Basic config */}
        <Card className="p-5 space-y-4">
          <h2 className="text-xl text-[var(--foreground)]">⚙️ Configurações</h2>
          <Input label="Nome da sala" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="Dê um nome à sua sala..."/>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-700 text-[var(--foreground)]">Sala Privada</div>
              <div className="text-xs text-[var(--muted-foreground)]">Apenas quem tiver o código e senha pode entrar</div>
            </div>
            <Toggle checked={isPrivate} onChange={setIsPrivate}/>
          </div>

          {isPrivate && (<Input label="Senha da sala" type="password" placeholder="Defina uma senha..." value={password} onChange={e => setPassword(e.target.value)}/>)}
        </Card>

        {/* Game config */}
        <Card className="p-5 space-y-4">
          <h2 className="text-xl text-[var(--foreground)]">🎮 Regras da Partida</h2>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Máx. de jogadores" value={maxPlayers} onChange={setMaxPlayers} options={['2', '3', '4', '5', '6', '7', '8'].map(v => ({ value: v, label: `${v} jogadores` }))}/>
            <Select label="Número de rodadas" value={totalRounds} onChange={setTotalRounds} options={['3', '4', '5', '6', '7', '8', '10'].map(v => ({ value: v, label: `${v} rodadas` }))}/>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-sm font-600 text-[var(--muted-foreground)] block mb-2">Dificuldade</label>
            <div className="grid grid-cols-3 gap-2">
              {['facil', 'medio', 'dificil'].map(d => {
            const cfg = DIFFICULTY_CONFIG[d];
            const borderClr = d === 'facil' ? 'var(--success)' : d === 'medio' ? 'var(--warning)' : 'var(--danger)';
            return (<button key={d} onClick={() => setDifficulty(d)} className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all ${difficulty === d ? 'text-white' : 'bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]'}`} style={difficulty === d ? { backgroundColor: borderClr, borderColor: borderClr } : {}}>
                    <div className="font-700 text-sm">{cfg.label}</div>
                    <div className={`text-xs mt-0.5 ${difficulty === d ? 'text-white/80' : 'text-[var(--muted-foreground)]'}`}>{cfg.time}s</div>
                  </button>);
        })}
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">ℹ️ {diff.description}</p>
          </div>
        </Card>

        {/* Categories */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-[var(--foreground)]">📂 Categorias</h2>
            <span className="text-sm text-[var(--muted-foreground)] font-600">{categories.length} selecionadas</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(c => (<CategoryChip key={c} label={c} onRemove={categories.length > 2 ? () => removeCategory(c) : undefined}/>))}
          </div>

          {/* Add custom */}
          <div className="flex gap-2">
            <Input placeholder="Nova categoria..." value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} className="flex-1"/>
            <Button variant="secondary" onClick={addCategory} disabled={!newCat.trim()}>+ Adicionar</Button>
          </div>

          {/* Quick-add defaults */}
          {available.length > 0 && (<div>
              <p className="text-xs text-[var(--muted-foreground)] font-600 mb-2">Adicionar rapidamente:</p>
              <div className="flex flex-wrap gap-2">
                {available.map(c => (<button key={c} onClick={() => addDefault(c)} className="text-xs bg-[var(--muted)] hover:bg-[var(--secondary)] text-[var(--foreground)] px-2.5 py-1 rounded-full cursor-pointer border border-[var(--border)] font-600 transition-all">
                    + {c}
                  </button>))}
              </div>
            </div>)}
        </Card>

        <Button size="xl" className="w-full" onClick={handleCreate} disabled={categories.length < 2}>
          🚀 Criar Sala
        </Button>
      </div>
    </Screen>);
}
