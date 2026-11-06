import { supabase } from './supabase'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem 0/O/1/I para não confundir

export function generateRoomCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('')
}

// A rota /entrar/:code será criada junto com o React Router
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

// Cria a sala e já coloca o dono dentro dela. Sem senha: o acesso é por código/link.
export async function createRoom({ name, isPublic, totalRounds, difficulty, categories, maxPlayers = 8, user }) {
  let room = null
  for (let attempt = 0; attempt < 5 && !room; attempt++) {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        code: generateRoomCode(),
        owner_id: user.id,
        name,
        is_public: isPublic,
        total_rounds: totalRounds,
        difficulty,
        categories,
        max_players: maxPlayers,
      })
      .select()
      .single()
    if (error) {
      if (error.code === '23505') continue // código repetido: tenta outro
      throw error
    }
    room = data
  }
  if (!room) throw new Error('Não foi possível gerar um código de sala.')
  await joinRoomByCode(room.code, user)
  return room
}

export async function joinRoomByCode(code, user) {
  const { data, error } = await supabase.rpc('join_room', {
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
    .select('user_id, username, avatar, joined_at')
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
    .eq('user_id', userId)
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