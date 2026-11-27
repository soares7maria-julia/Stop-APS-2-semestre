// Converte erros de sala recebidos do banco em mensagens claras para o jogador.
// Mensagens do banco (create_room / join_room_by_code) em linguagem de jogador
export function traduzirErroSala(err) {
  const msg = err?.message ?? ''
  if (msg.includes('não encontrada') || msg.includes('expirada')) return 'Sala não encontrada. Verifique o código ou o link (salas paradas há 10 minutos são fechadas).'
  if (msg.includes('cheia')) return 'Essa sala está cheia.'
  if (msg.includes('já começou')) return 'A partida dessa sala já começou.'
  if (msg.includes('Nome de sala')) return 'Nome de sala inválido.'
  if (msg.includes('Não autenticado')) return 'Sua sessão expirou. Entre novamente.'
  if (msg.includes('Failed to fetch')) return 'Sem conexão com o servidor. Tente novamente.'
  return 'Não foi possível concluir. Tente novamente.'
}