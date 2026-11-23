import { supabase } from './supabase'

// Converte a linha do banco (snake_case) no formato que as telas usam
export function toRoom(row) {
  if (!row) return null
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    ownerId: row.owner_id,
    isPrivate: row.is_private ?? false,
    maxPlayers: row.max_players,
    difficulty: row.difficulty,
    totalRounds: row.total_rounds,
    categories: row.categories ?? [],
    status: row.status ?? 'waiting',
    playerCount: row.player_count != null ? Number(row.player_count) : undefined,
  }
}

// Link de convite: abre /entrar/:code, que coloca a pessoa na sala
export function buildInviteLink(code) {
  return `${window.location.origin}/entrar/${code}`
}

// Só salas públicas, em espera e não vencidas
export async function listPublicRooms() {
  const { data, error } = await supabase.rpc('list_public_rooms')
  if (error) throw error
  return (data ?? []).map(toRoom)
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
  return toRoom(data)
}

export async function joinRoomByCode(code, user) {
  const { data, error } = await supabase.rpc('join_room_by_code', {
    p_code: code,
    p_username: user.name,
    p_avatar: user.avatar,
  })
  if (error) throw error
  return toRoom(data)
}

// Acha a sala pelo código sem entrar (null se não existe mais ou venceu)
export async function findRoomByCode(code) {
  const { data, error } = await supabase.rpc('find_room_by_code', { p_code: code })
  if (error) throw error
  return toRoom(data?.[0] ?? null)
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

// Sair da sala, ou (sendo o dono) remover um jogador
export async function leaveRoom(roomId, playerId) {
  const { error } = await supabase
    .from('room_players')
    .delete()
    .eq('room_id', roomId)
    .eq('player_id', playerId)
  if (error) throw error
}

// O jogador marca/desmarca o próprio "pronto"
export async function setReady(roomId, playerId, ready) {
  const { error } = await supabase
    .from('room_players')
    .update({ is_ready: ready })
    .eq('room_id', roomId)
    .eq('player_id', playerId)
  if (error) throw error
}

// Dono inicia a partida: a sala sai da lista pública e ninguém mais entra
export async function startRoom(roomId) {
  const { error } = await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId)
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
    .channel(`room-presence-${roomId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
      () => onChange())
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      () => onChange())
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// Chat do lobby por Realtime Broadcast: as mensagens não são gravadas no banco
export function joinRoomChat(roomId, onMessage) {
  const channel = supabase
    .channel(`chat-${roomId}`, { config: { broadcast: { self: true } } })
    .on('broadcast', { event: 'message' }, ({ payload }) => onMessage(payload))
    .subscribe()
  return {
    send: message => channel.send({ type: 'broadcast', event: 'message', payload: message }),
    leave: () => supabase.removeChannel(channel),
  }
}

// Canal único da partida: o dono publica a letra/fases/resultados e os jogadores
// enviam suas respostas pelo mesmo tópico Realtime.
export function joinRoomGame(roomId, onEvent, onStatus = () => {}) {
  let subscribed = false
  const pending = []
  const channel = supabase.channel(`room-${roomId}`, { config: { broadcast: { self: true } } })
    .on('broadcast', { event: 'game' }, ({ payload }) => onEvent(payload))
    .subscribe(status => {
      subscribed = status === 'SUBSCRIBED'
      onStatus(status)
      if (subscribed) while (pending.length) channel.send({ type: 'broadcast', event: 'game', payload: pending.shift() })
    })
  return {
    send: payload => {
      if (!subscribed) { pending.push(payload); return Promise.resolve('queued') }
      return channel.send({ type: 'broadcast', event: 'game', payload })
    },
    leave: () => supabase.removeChannel(channel),
  }
}
