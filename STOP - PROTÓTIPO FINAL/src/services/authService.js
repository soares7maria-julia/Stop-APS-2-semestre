// Encapsula chamadas ao Supabase Auth para cadastro, login, convidado, sessão, perfil e logout.
import { supabase } from './supabase'

// Cadastro: nome e avatar vão em "options.data" (metadados do usuário).
// O trigger do banco lê esses metadados para criar a linha em profiles.
export async function signUp({ email, password, username, avatar }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, avatar } },
  })
  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// Convidado: sessão anônima (sem e-mail). Serve só para o banco saber "quem é quem"
// nas salas. O app trata essa sessão como convidado: sem perfil, sem ranking.
export async function signInGuest({ username, avatar }) {
  const { data, error } = await supabase.auth.signInAnonymously({
    options: { data: { username, avatar } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// O Supabase guarda a sessão no armazenamento do navegador, por isso ela sobrevive ao F5
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

// Avisa quando login/logout acontece. Retorna uma função para cancelar a observação.
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}

// Atualiza nome e avatar na sessão (metadados) e na tabela profiles
export async function updateProfile({ userId, username, avatar }) {
  const { error: authError } = await supabase.auth.updateUser({ data: { username, avatar } })
  if (authError) throw authError
  const { error } = await supabase.from('profiles').update({ username, avatar }).eq('id', userId)
  if (error) throw error
}