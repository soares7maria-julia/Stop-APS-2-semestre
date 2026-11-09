export function traduzirErro(err) {
  const msg = err?.message ?? ''
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.includes('already registered')) return 'Este e-mail já está cadastrado.'
  if (msg.includes('at least 6')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (msg.toLowerCase().includes('anonymous')) return 'A entrada como convidado não está habilitada no Supabase.'
  if (msg.includes('Failed to fetch')) return 'Sem conexão com o servidor. Tente novamente.'
  return 'Algo deu errado. Tente novamente.'
}