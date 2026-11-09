import { supabase } from './supabase'

// A rota /entrar/:code será criada junto com as telas de sala
export function buildInviteLink(code) {
  return `${window.location.origin}/entrar/${code}`
}

// Só salas públicas, em espera e não vencidas
export async function listPublicRooms() {
  const { data, error } = await supabase.rpc('list_public_rooms')
  if (error) throw error
  return data ?? []
}

// Tempo real: avisa quando qualquer sala é criada, alterada ou excluída.
// Quem chama refaz listPublicRooms(). Retorna a função que cancela a assinatura.
export function subscribeToPublicRooms(onChange) {
  const channel = supabase
    .channel('public-rooms')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => onChange())
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// Cria a sala. O código é gerado no Supabase e o dono já entra como jogador (uma chamada só).
// Sem senha: o acesso é por código/link.
export async function createRoom({ name, isPrivate, totalRounds, difficulty, categories, maxPlayers = 8, user }) {
  const { data, error } = await supabase.rpc('create_room', {
    p_name: name,
    p_is_private: isPrivate,
    p_max_players: maxPlayers,
    p_difficulty: difficulty,
    p_total_rounds: totalRounds,
    p_categories: categories,
    p_username: user.name,
    p_avatar: user.avatar,
  })
  if (error) throw error
  return data // linha da sala, com o código gerado
}

export async function joinRoomByCode(code, user) {
  const { data, error } = await supabase.rpc('join_room_by_code', {
    p_code: code,
    p_username: user.name,
    p_avatar: user.avatar,
  })
  if (error) throw error
  return data
}

export async function findRoomByCode(code) {
  const { data, error } = await supabase.rpc('find_room_by_code', { p_code: code })
  if (error) throw error
  return data?.[0] ?? null
}

export async function getRoomPlayers(roomId) {
  const { data, error } = await supabase
    .from('room_players')
    .select('player_id, username, avatar, is_ready, score, joined_at')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Só o dono consegue (regra no banco). O botão só aparece para ele, mas quem protege é o RLS.
export async function deleteRoom(roomId) {
  const { error } = await supabase.from('rooms').delete().eq('id', roomId)
  if (error) throw error
}

export async function leaveRoom(roomId, userId) {
  const { error } = await supabase
    .from('room_players')
    .delete()
    .eq('room_id', roomId)
    .eq('player_id', userId)
  if (error) throw error
}

// O jogador marca/desmarca o próprio "pronto"
export async function setReady(roomId, userId, ready) {
  const { error } = await supabase
    .from('room_players')
    .update({ is_ready: ready })
    .eq('room_id', roomId)
    .eq('player_id', userId)
  if (error) throw error
}

// Chamar de tempos em tempos enquanto a sala está em uso, para ela não vencer
export async function touchRoom(roomId) {
  const { error } = await supabase.rpc('touch_room', { p_room: roomId })
  if (error) throw error
}

// Lobby em tempo real: jogadores entrando/saindo e a sala sendo alterada ou excluída
export function subscribeToRoom(roomId, onChange) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
      () => onChange())
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      payload => onChange(payload))
    .subscribe()
  return () => supabase.removeChannel(channel)
}