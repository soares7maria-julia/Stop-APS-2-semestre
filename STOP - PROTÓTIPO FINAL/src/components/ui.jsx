//serve para reunir componentes visuais reutilizáveis do projeto.

//Por exemplo, em vez de criar um botão do zero em cada tela, você pode criar um componente de 
// botão nesse arquivo e utilizá-lo em várias telas.

import React, { useState, useEffect } from 'react';
const btnBase = 'inline-flex items-center justify-center gap-2 font-bold rounded-2xl cursor-pointer border-0 select-none';
const btnVariants = {
    primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:scale-95 shadow-lg shadow-[var(--primary)]/30',
    secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80 active:scale-95',
    danger: 'bg-[var(--danger)] text-white hover:opacity-90 active:scale-95 shadow-md shadow-[var(--danger)]/30',
    ghost: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)] active:scale-95',
    accent: 'bg-[var(--accent)] text-white hover:opacity-90 active:scale-95 shadow-lg shadow-[var(--accent)]/30',
};
const btnSizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
    xl: 'px-10 py-4 text-xl',
};
export function Button({ variant = 'primary', size = 'md', disabled, className = '', children, ...props }) {
    return (<button {...props} disabled={disabled} className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}>
      {children}
    </button>);
}
// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
    return (<div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-600 text-[var(--muted-foreground)]">{label}</label>}
      <input {...props} className={`w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] font-500 ${error ? 'border-[var(--danger)]' : ''} ${className}`}/>
      {error && <span className="text-xs text-[var(--danger)] font-600">{error}</span>}
    </div>);
}
// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        if (open)
            document.body.style.overflow = 'hidden';
        else
            document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);
    if (!open)
        return null;
    const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
      <div className={`relative w-full ${widths[size]} bg-[var(--card)] rounded-3xl shadow-2xl animate-bounce-in max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        {title && (<div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--border)]">
            <h2 className="text-2xl text-[var(--card-foreground)]">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--muted)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] cursor-pointer border-0">✕</button>
          </div>)}
        <div className="p-6">{children}</div>
      </div>
    </div>);
}
export function ToastContainer({ toasts, onRemove }) {
    useEffect(() => {
        toasts.forEach(t => {
            const timer = setTimeout(() => onRemove(t.id), 3500);
            return () => clearTimeout(timer);
        });
    }, [toasts, onRemove]);
    const colors = {
        success: 'bg-[var(--success)] text-white',
        error: 'bg-[var(--danger)] text-white',
        warning: 'bg-[var(--warning)] text-[var(--foreground)]',
        info: 'bg-[var(--primary)] text-white',
    };
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    return (<div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full">
      {toasts.map(t => (<div key={t.id} className={`${colors[t.type || 'info']} rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 animate-slide-in-right cursor-pointer font-600`} onClick={() => onRemove(t.id)}>
          <span>{icons[t.type || 'info']}</span>
          <span className="flex-1 text-sm">{t.message}</span>
        </div>))}
    </div>);
}
export function useToast() {
    const [toasts, setToasts] = useState([]);
    const add = (message, type = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, message, type }]);
    };
    const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));
    return { toasts, add, remove };
}
// ── PlayerCard ────────────────────────────────────────────────────────────────
const AVATARS = ['🦊', '🐼', '🐸', '🦋', '🐙', '🦄', '🐬', '🦁', '🐨', '🐯', '🦀', '🦚'];
export function PlayerCard({ name, avatar, status, isOwner, isYou, score, onKick }) {
    const statusColors = {
        pronto: 'bg-[var(--success)] text-white',
        aguardando: 'bg-[var(--warning)] text-[var(--foreground)]',
        digitando: 'bg-[var(--primary)] text-white',
    };
    const statusLabels = { pronto: '✓ Pronto', aguardando: '⏳ Aguardando', digitando: '✍️ Digitando' };
    return (<div className={`flex items-center gap-3 p-3 rounded-2xl ${isYou ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]' : 'bg-[var(--muted)]'}`}>
      <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center text-2xl flex-shrink-0">{avatar}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-700 text-[var(--card-foreground)] truncate">{name}</span>
          {isOwner && <span className="text-xs bg-[var(--accent)] text-white px-2 py-0.5 rounded-full font-700">👑 Dono</span>}
          {isYou && <span className="text-xs bg-[var(--primary)] text-white px-2 py-0.5 rounded-full font-700">Você</span>}
        </div>
        {status && <span className={`text-xs px-2 py-0.5 rounded-full font-600 ${statusColors[status]}`}>{statusLabels[status]}</span>}
        {score !== undefined && <div className="text-sm font-700 text-[var(--primary)] mt-0.5">{score} pts</div>}
      </div>
      {onKick && (<button onClick={onKick} className="w-7 h-7 rounded-full bg-[var(--danger)]/20 text-[var(--danger)] hover:bg-[var(--danger)]/40 flex items-center justify-center text-sm cursor-pointer border-0 font-700">✕</button>)}
    </div>);
}
export { AVATARS };
// ── CategoryChip ──────────────────────────────────────────────────────────────
export function CategoryChip({ label, onRemove }) {
    return (<span className="inline-flex items-center gap-1.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] px-3 py-1.5 rounded-full text-sm font-700">
      {label}
      {onRemove && (<button onClick={onRemove} className="w-4 h-4 rounded-full bg-[var(--secondary-foreground)]/20 hover:bg-[var(--danger)]/30 flex items-center justify-center text-xs cursor-pointer border-0 text-[var(--secondary-foreground)] leading-none">✕</button>)}
    </span>);
}
// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }) {
    if (!label)
        return <hr className="border-[var(--border)]"/>;
    return (<div className="flex items-center gap-3">
      <hr className="flex-1 border-[var(--border)]"/>
      <span className="text-sm text-[var(--muted-foreground)] font-600">{label}</span>
      <hr className="flex-1 border-[var(--border)]"/>
    </div>);
}
// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'primary' }) {
    const colors = {
        primary: 'bg-[var(--primary)] text-[var(--primary-foreground)]',
        success: 'bg-[var(--success)] text-white',
        danger: 'bg-[var(--danger)] text-white',
        warning: 'bg-[var(--warning)] text-[var(--foreground)]',
        muted: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
    };
    return <span className={`text-xs font-700 px-2 py-0.5 rounded-full ${colors[color]}`}>{children}</span>;
}
// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ className = '', children, onClick }) {
    return (<div className={`bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-md ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-[var(--primary)] transition-all' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>);
}
// ── Stop Sign ────────────────────────────────────────────────────────────────
export function StopSign({ className = '', textClassName = '' }) {
    return (<div className={`stop-sign bg-[var(--danger)] p-1.5 flex items-center justify-center ${className}`} aria-label="STOP">
      <div className="stop-sign w-full h-full bg-white p-1.5 flex items-center justify-center">
        <div className="stop-sign w-full h-full bg-[var(--danger)] flex items-center justify-center">
          <span className={`font-display font-normal leading-none text-white ${textClassName}`}>STOP</span>
        </div>
      </div>
    </div>);
}
// ── Avatar Picker ─────────────────────────────────────────────────────────────
export function AvatarPicker({ value, onChange }) {
    return (<div className="flex flex-wrap gap-2 justify-center">
      {AVATARS.map(a => (<button key={a} onClick={() => onChange(a)} className={`w-12 h-12 text-2xl rounded-2xl cursor-pointer border-2 transition-all ${value === a ? 'border-[var(--primary)] bg-[var(--primary)]/10 scale-110' : 'border-[var(--border)] bg-[var(--muted)] hover:border-[var(--primary)]/50'}`}>
          {a}
        </button>))}
    </div>);
}
// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }) {
    return (<label className="flex items-center gap-3 cursor-pointer">
      <div className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} onClick={() => onChange(!checked)}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`}/>
      </div>
      {label && <span className="text-sm font-600 text-[var(--foreground)]">{label}</span>}
    </label>);
}
// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, options, value, onChange, className = '' }) {
    return (<div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-600 text-[var(--muted-foreground)]">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] focus:outline-none focus:border-[var(--primary)] font-600 cursor-pointer">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>);
}
// ── Screen wrapper ─────────────────────────────────────────────────────────────
export function Screen({ children, className = '' }) {
    return (<div className={`min-h-screen bg-[var(--background)] flex flex-col animate-fade-in ${className}`}>
      {children}
    </div>);
}
// ── TopBar ────────────────────────────────────────────────────────────────────
export function TopBar({ title, onBack, rightSlot, subtitle }) {
    return (<div className="sticky top-0 z-30 bg-[var(--card)]/80 backdrop-blur border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
      {onBack && (<button onClick={onBack} className="w-9 h-9 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] flex items-center justify-center cursor-pointer border-0 text-[var(--foreground)] font-700 flex-shrink-0">
          ←
        </button>)}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl truncate text-[var(--foreground)]">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--muted-foreground)] truncate">{subtitle}</p>}
      </div>
      {rightSlot}
    </div>);
}
