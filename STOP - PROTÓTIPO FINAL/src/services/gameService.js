// Encapsula as consultas e gravações de pontuação, ranking, estatísticas e histórico no Supabase.
import { supabase } from './supabase'

// Registra a pontuação da partida. O banco só atualiza o recorde se a nova pontuação for maior.
// Falha se a sessão for de convidado (anônimo).
export async function submitScore({ points, won = false, players = 1, rounds = 1 }) {
  const { data, error } = await supabase.rpc('submit_score', {
    p_points: points,
    p_won: won,
    p_players: players,
    p_rounds: rounds,
  })
  if (error) throw error
  return data // linha de player_stats: { best_score, games_played, games_won, ... }
}

// Ranking público, ordenado pelo recorde (desempate: quem chegou primeiro nele)
export async function getRanking(limit = 50) {
  const { data, error } = await supabase.rpc('get_ranking', { p_limit: limit })
  if (error) throw error
  return (data ?? []).map(r => ({
    user_id: r.player_id,
    display_name: r.display_name,
    avatar: r.avatar,
    best_score: r.best_score,
    games_played: r.games_played,
    wins: r.games_won,
  }))
}

// Estatísticas do perfil. Quem nunca jogou recebe zeros (nunca dados inventados).
export async function getMyStats() {
  const { data, error } = await supabase.rpc('get_my_stats')
  if (error) throw error
  const row = data?.[0]
  return {
    games_played: row?.games_played ?? 0,
    total_points: Number(row?.total_points ?? 0),
    wins: row?.games_won ?? 0,
    best_score: row?.best_score ?? 0,
  }
}

// Últimas partidas do próprio jogador
export async function getMyHistory(userId, limit = 10) {
  const { data, error } = await supabase
    .from('game_history')
    .select('id, points, won, players, rounds, played_at')
    .eq('player_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}