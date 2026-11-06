import { supabase } from './supabase'

// Registra a pontuação da partida. O banco só atualiza o recorde se a nova pontuação for maior.
// Falha se a sessão for de convidado (anônimo).
export async function submitScore({ points, won = false }) {
  const { data, error } = await supabase.rpc('submit_score', {
    p_points: points,
    p_won: won,
  })
  if (error) throw error
  return data
}

// Ranking público, ordenado pelo recorde (desempate: quem chegou primeiro nele)
export async function getRanking(limit = 50) {
  const { data, error } = await supabase
    .from('player_stats')
    .select('user_id, display_name, avatar, best_score, games_played, wins')
    .order('best_score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// Estatísticas do perfil. Quem nunca jogou recebe zeros (nunca dados inventados).
export async function getMyStats(userId) {
  const { data, error } = await supabase
    .from('player_stats')
    .select('games_played, total_points, wins, best_score')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ?? { games_played: 0, total_points: 0, wins: 0, best_score: 0 }
}