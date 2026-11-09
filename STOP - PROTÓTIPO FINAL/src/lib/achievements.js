// Conquistas calculadas a partir das estatísticas reais do jogador (nada fixo).
export const ACHIEVEMENTS = [
  { id: 'first-win', icon: '🏆', title: 'Primeira Vitória', desc: 'Vença sua primeira partida', test: s => s.wins >= 1 },
  { id: 'ten-games', icon: '🎯', title: '10 Partidas Jogadas', desc: 'Jogue 10 partidas completas', test: s => s.games_played >= 10 },
  { id: 'fifty-games', icon: '🌟', title: 'Mestre das Letras', desc: 'Jogue 50 partidas completas', test: s => s.games_played >= 50 },
  { id: 'hundred', icon: '💎', title: 'Perfeito!', desc: 'Faça 100 pontos em uma partida', test: s => s.best_score >= 100 },
]

const EMPTY = { games_played: 0, total_points: 0, wins: 0, best_score: 0 }

export function getAchievements(stats) {
  const s = stats ?? EMPTY
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.test(s) }))
}