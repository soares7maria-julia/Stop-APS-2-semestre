// Cria o cliente Supabase usando a URL e a chave pública definidas no ambiente.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
)