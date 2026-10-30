// Shared types and mock data for the Stop! game prototype
export const DEFAULT_CATEGORIES = ['Nome', 'Animal', 'Cidade', 'Cor', 'Fruta', 'País', 'Objeto', 'Profissão', 'Comida', 'Marca', 'Filme', 'Esporte'];
export const DIFFICULTY_CONFIG = {
    facil: { label: 'Fácil', time: 120, description: '120s por rodada, todas as letras', lettersPool: 'ABCDEFGHIJKLMNOPRSTV' },
    medio: { label: 'Médio', time: 90, description: '90s por rodada, maioria das letras', lettersPool: 'ABCDEFGHIJKLMNOPRST' },
    dificil: { label: 'Difícil', time: 60, description: '60s por rodada, letras mais difíceis incluídas', lettersPool: 'ABCDEFGHIJKLMNOPRSTUVWXYZ' },
};
// Mock public rooms
export const MOCK_ROOMS = [
    {
        id: '1', name: 'Sala da Turma', code: 'ABC123', isPrivate: false,
        maxPlayers: 6, difficulty: 'facil', totalRounds: 5,
        categories: ['Nome', 'Animal', 'Cidade', 'Cor', 'Fruta'],
        players: [
            { id: 'p1', name: 'Pedro Silva', avatar: '🦊', isOwner: true, status: 'pronto', score: 0 },
            { id: 'p2', name: 'Ana Lima', avatar: '🐼', isOwner: false, status: 'aguardando', score: 0 },
            { id: 'p3', name: 'Carlos Neto', avatar: '🐸', isOwner: false, status: 'pronto', score: 0 },
        ],
        status: 'aguardando'
    },
    {
        id: '2', name: 'Stop! Profis', code: 'XYZ789', isPrivate: false,
        maxPlayers: 8, difficulty: 'dificil', totalRounds: 8,
        categories: ['Nome', 'Animal', 'Cidade', 'Cor', 'Fruta', 'País', 'Objeto', 'Profissão'],
        players: [
            { id: 'p4', name: 'Mariana Costa', avatar: '🦋', isOwner: true, status: 'pronto', score: 0 },
            { id: 'p5', name: 'João Ferreira', avatar: '🐙', isOwner: false, status: 'pronto', score: 0 },
            { id: 'p6', name: 'Luísa Mendes', avatar: '🦄', isOwner: false, status: 'pronto', score: 0 },
            { id: 'p7', name: 'Rafael Souza', avatar: '🐬', isOwner: false, status: 'aguardando', score: 0 },
            { id: 'p8', name: 'Camila Torres', avatar: '🦁', isOwner: false, status: 'pronto', score: 0 },
        ],
        status: 'aguardando'
    },
    {
        id: '3', name: 'Iniciantes 🎮', code: 'DEF456', isPrivate: false,
        maxPlayers: 4, difficulty: 'facil', totalRounds: 3,
        categories: ['Nome', 'Animal', 'Cidade'],
        players: [
            { id: 'p9', name: 'Beatriz Alves', avatar: '🐨', isOwner: true, status: 'pronto', score: 0 },
            { id: 'p10', name: 'Lucas Rocha', avatar: '🐯', isOwner: false, status: 'pronto', score: 0 },
        ],
        status: 'aguardando'
    },
    {
        id: '4', name: 'Sala Privada 🔒', code: 'GHI999', isPrivate: true,
        maxPlayers: 5, difficulty: 'medio', totalRounds: 5,
        categories: ['Nome', 'Animal', 'Cidade', 'Cor', 'Fruta'],
        players: [
            { id: 'p11', name: 'Fernanda Lima', avatar: '🦀', isOwner: true, status: 'pronto', score: 0 },
        ],
        status: 'aguardando'
    },
];
// Mock lobby players
export const MOCK_LOBBY_PLAYERS = [
    { id: 'you', name: 'Você', avatar: '🦊', isOwner: true, status: 'aguardando', score: 0 },
    { id: 'p2', name: 'Ana Lima', avatar: '🐼', isOwner: false, status: 'pronto', score: 0 },
    { id: 'p3', name: 'Carlos Neto', avatar: '🐸', isOwner: false, status: 'aguardando', score: 0 },
    { id: 'p4', name: 'Mariana Costa', avatar: '🦋', isOwner: false, status: 'pronto', score: 0 },
];
// Mock review data for letter 'B'
export const MOCK_REVIEW = [
    {
        category: 'Nome', answers: [
            { playerId: 'you', playerName: 'Você', playerAvatar: '🦊', value: 'Beatriz', isValid: true, votes: 4, totalVoters: 4, isRepeated: false, contested: false },
            { playerId: 'p2', playerName: 'Ana Lima', playerAvatar: '🐼', value: 'Bruno', isValid: true, votes: 4, totalVoters: 4, isRepeated: false, contested: false },
            { playerId: 'p3', playerName: 'Carlos Neto', playerAvatar: '🐸', value: 'Beatriz', isValid: true, votes: 4, totalVoters: 4, isRepeated: true, contested: false },
            { playerId: 'p4', playerName: 'Mariana Costa', playerAvatar: '🦋', value: '', isValid: false, votes: 0, totalVoters: 4, isRepeated: false, contested: false },
        ]
    },
    {
        category: 'Animal', answers: [
            { playerId: 'you', playerName: 'Você', playerAvatar: '🦊', value: 'Baleia', isValid: true, votes: 4, totalVoters: 4, isRepeated: false, contested: false },
            { playerId: 'p2', playerName: 'Ana Lima', playerAvatar: '🐼', value: 'Búfalo', isValid: true, votes: 4, totalVoters: 4, isRepeated: false, contested: false },
            { playerId: 'p3', playerName: 'Carlos Neto', playerAvatar: '🐸', value: 'Bode', isValid: true, votes: 4, totalVoters: 4, isRepeated: false, contested: false },
            { playerId: 'p4', playerName: 'Mariana Costa', playerAvatar: '🦋', value: 'Bicho', isValid: null, votes: 1, totalVoters: 4, isRepeated: false, contested: true },
        ]
    },
    {
        category: 'Cidade', answers: [
            { playerId: 'you', playerName: 'Você', playerAvatar: '🦊', value: 'Belém', isValid: true, votes: 4, totalVoters: 4, isRepeated: false, contested: false },
            { playerId: 'p2', playerName: 'Ana Lima', playerAvatar: '🐼', value: 'Brasília', isValid: true, votes: 4, totalVoters: 4, isRepeated: false, contested: false },
            { playerId: 'p3', playerName: 'Carlos Neto', playerAvatar: '🐸', value: 'Belém', isValid: true, votes: 4, totalVoters: 4, isRepeated: true, contested: false },
            { playerId: 'p4', playerName: 'Mariana Costa', playerAvatar: '🦋', value: 'Belo Horizonte', isValid: true, votes: 4, totalVoters: 4, isRepeated: false, contested: false },
        ]
    },
];
// Mock round results
export const MOCK_ROUND_RESULTS = [
    { playerId: 'you', name: 'Você', avatar: '🦊', roundScore: 85, totalScore: 85, categories: { Nome: 10, Animal: 10, Cidade: 5, Cor: 10, Fruta: 10 } },
    { playerId: 'p2', name: 'Ana Lima', avatar: '🐼', roundScore: 75, totalScore: 75, categories: { Nome: 10, Animal: 10, Cidade: 10, Cor: 5, Fruta: 10 } },
    { playerId: 'p3', name: 'Carlos Neto', avatar: '🐸', roundScore: 40, totalScore: 40, categories: { Nome: 5, Animal: 10, Cidade: 5, Cor: 0, Fruta: 10 } },
    { playerId: 'p4', name: 'Mariana Costa', avatar: '🦋', roundScore: 30, totalScore: 30, categories: { Nome: 0, Animal: 0, Cidade: 10, Cor: 10, Fruta: 0 } },
];
// Mock game over results
export const MOCK_GAME_OVER = [
    { place: 1, playerId: 'you', name: 'Você', avatar: '🦊', score: 385 },
    { place: 2, playerId: 'p2', name: 'Ana Lima', avatar: '🐼', score: 320 },
    { place: 3, playerId: 'p3', name: 'Carlos Neto', avatar: '🐸', score: 215 },
    { place: 4, playerId: 'p4', name: 'Mariana Costa', avatar: '🦋', score: 180 },
];
// Mock ranking
export const MOCK_RANKING_GLOBAL = [
    { rank: 1, name: 'Thiago Melo', avatar: '🦚', score: 4820, date: '20/09/2026' },
    { rank: 2, name: 'Fernanda Lima', avatar: '🦀', score: 4310, date: '19/09/2026' },
    { rank: 3, name: 'Você', avatar: '🦊', score: 3850, date: '21/09/2026', isYou: true },
    { rank: 4, name: 'Beatriz Alves', avatar: '🐨', score: 3720, date: '18/09/2026' },
    { rank: 5, name: 'Lucas Rocha', avatar: '🐯', score: 3540, date: '17/09/2026' },
    { rank: 6, name: 'Ana Lima', avatar: '🐼', score: 3210, date: '21/09/2026' },
    { rank: 7, name: 'Carlos Neto', avatar: '🐸', score: 2980, date: '20/09/2026' },
    { rank: 8, name: 'Mariana Costa', avatar: '🦋', score: 2750, date: '19/09/2026' },
    { rank: 9, name: 'João Ferreira', avatar: '🐙', score: 2410, date: '18/09/2026' },
    { rank: 10, name: 'Luísa Mendes', avatar: '🦄', score: 2100, date: '17/09/2026' },
];
export const MOCK_MY_SCORES = [
    { rank: 1, name: 'Partida #47', avatar: '🏆', score: 385, date: '21/09/2026', players: 4, rounds: 5 },
    { rank: 2, name: 'Partida #46', avatar: '🥈', score: 320, date: '20/09/2026', players: 6, rounds: 8 },
    { rank: 3, name: 'Partida #45', avatar: '🥉', score: 280, date: '19/09/2026', players: 3, rounds: 5 },
    { rank: 4, name: 'Partida #44', avatar: '⭐', score: 240, date: '18/09/2026', players: 5, rounds: 5 },
    { rank: 5, name: 'Partida #43', avatar: '⭐', score: 195, date: '17/09/2026', players: 4, rounds: 3 },
];
export const MOCK_ACHIEVEMENTS = [
    { id: 'a1', icon: '🏆', title: 'Primeira Vitória', desc: 'Vença sua primeira partida', unlocked: true, date: '15/09/2026' },
    { id: 'a2', icon: '⚡', title: 'Pontuação Perfeita', desc: 'Acerte todas as categorias em uma rodada', unlocked: true, date: '18/09/2026' },
    { id: 'a3', icon: '🎯', title: '10 Partidas Jogadas', desc: 'Jogue 10 partidas completas', unlocked: true, date: '20/09/2026' },
    { id: 'a4', icon: '🛑', title: 'Aperta STOP!', desc: 'Pressione STOP 5 vezes em uma partida', unlocked: true, date: '21/09/2026' },
    { id: 'a5', icon: '🌟', title: 'Mestre das Letras', desc: 'Jogue 50 partidas completas', unlocked: false },
    { id: 'a6', icon: '👑', title: 'Invicto', desc: 'Vença 5 partidas seguidas', unlocked: false },
    { id: 'a7', icon: '💎', title: 'Perfeito!', desc: 'Complete 100 pontos em uma partida', unlocked: false },
    { id: 'a8', icon: '🚀', title: 'Velocidade da Luz', desc: 'Pressione STOP em menos de 30 segundos', unlocked: false },
];
