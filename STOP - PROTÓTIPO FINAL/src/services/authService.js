import { supabase } from './supabase'

// Nome e avatar vão em "options.data" (metadados do usuário).
// O trigger da Pessoa 2 lê esses metadados para criar a linha em profiles.
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// O Supabase guarda a sessão no localStorage, por isso ela sobrevive ao F5
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