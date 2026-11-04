import React, { useState } from 'react';
import { Button, Input, Divider, AvatarPicker, Card, StopSign } from '../components/ui';
import { AVATARS } from '../components/ui';
import { signUp, signIn } from '../services/authService';

function traduzirErro(err) {
    const msg = err?.message ?? '';
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('at least 6')) return 'A senha precisa ter pelo menos 6 caracteres.';
    return 'Algo deu errado. Tente novamente.';
}

export function AuthScreen({ onAuth }) {
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(AVATARS[0]);
    const [step, setStep] = useState('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function runAuth(action) {
        setError('');
        setLoading(true);
        try {
            return await action();
        }
        catch (err) {
            setError(traduzirErro(err));
        }
        finally {
            setLoading(false);
        }
    }

    async function handleRegister() {
        await runAuth(() => signUp({ email: email.trim(), password, username: name.trim(), avatar }));
        // O App.jsx detecta a sessão criada e leva ao menu sozinho
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (mode === 'guest') {
            if (!name.trim())
                return;
            onAuth({ name: name.trim(), avatar, isGuest: true });
            return;
        }
        if (!email.trim() || !password.trim())
            return;
        if (mode === 'register' && !name.trim())
            return;
        if (mode === 'login') {
            await runAuth(() => signIn({ email: email.trim(), password }));
            return;
        }
        if (step === 'form' && mode === 'register') {
            setError('');
            setStep('avatar');
            return;
        }
    }

    return (<div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--accent)]/20 rounded-full blur-3xl"/>
      </div>

      <Card className="w-full max-w-md p-8 relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <StopSign className="w-20 h-20 mb-4 mx-auto shadow-xl shadow-[var(--danger)]/30 animate-pulse-ring" textClassName="text-xl"/>
          <h1 className="text-4xl text-[var(--primary)]">Stop!</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1 font-500">O jogo de palavras mais divertido</p>
        </div>

        {step === 'avatar' && mode === 'register' ? (<div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl text-[var(--foreground)] mb-1">Escolha seu avatar</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Como os outros jogadores vão te ver</p>
            </div>
            <div className="flex justify-center text-6xl mb-2">{avatar}</div>
            <AvatarPicker value={avatar} onChange={setAvatar}/>
            {error && <p className="text-sm text-[var(--danger)] text-center">{error}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep('form')}>← Voltar</Button>
              <Button size="lg" className="flex-1" onClick={handleRegister} disabled={loading}>Entrar 🎮</Button>
            </div>
          </div>) : (<>
            {/* Mode tabs */}
            <div className="flex bg-[var(--muted)] rounded-2xl p-1 mb-6">
              {['login', 'register', 'guest'].map(m => (<button key={m} onClick={() => { setMode(m); setError(''); }} className={`flex-1 py-2 rounded-xl text-sm font-700 cursor-pointer border-0 transition-all ${mode === m ? 'bg-[var(--card)] text-[var(--primary)] shadow-md' : 'text-[var(--muted-foreground)] bg-transparent'}`}>
                  {m === 'login' ? 'Entrar' : m === 'register' ? 'Criar Conta' : 'Convidado'}
                </button>))}
            </div>

            {error && <p className="text-sm text-[var(--danger)] text-center mb-3">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {(mode === 'register' || mode === 'guest') && (<Input label="Nome de usuário" placeholder="Como você quer ser chamado?" value={name} onChange={e => setName(e.target.value)} required/>)}
              {mode !== 'guest' && (<>
                  <Input label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required/>
                  <Input label="Senha" type="password" placeholder={mode === 'register' ? 'Crie uma senha segura' : 'Sua senha'} value={password} onChange={e => setPassword(e.target.value)} required/>
                </>)}

              {mode === 'guest' && (<div className="space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)] font-600 text-center">Escolha seu avatar</p>
                  <div className="flex justify-center text-5xl">{avatar}</div>
                  <AvatarPicker value={avatar} onChange={setAvatar}/>
                </div>)}

              <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
                {mode === 'login' ? '🎮 Entrar' : mode === 'register' ? '✨ Próximo' : '🎲 Jogar como Convidado'}
              </Button>
            </form>

            {mode !== 'guest' && (<>
                <Divider label="ou"/>
                <Button variant="secondary" size="md" className="w-full" onClick={() => setMode('guest')}>
                  🎲 Jogar sem conta
                </Button>
              </>)}
          </>)}
      </Card>
    </div>);
}