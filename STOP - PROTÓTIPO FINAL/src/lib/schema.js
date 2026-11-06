import { z } from 'zod'

const email = z.string().trim().min(1, 'Informe seu e-mail.').email('E-mail inválido.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
})

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'O nome deve ter pelo menos 3 caracteres.')
    .max(20, 'O nome pode ter no máximo 20 caracteres.'),
  email,
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})

export const guestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(20, 'O nome pode ter no máximo 20 caracteres.'),
})

// Roda o schema e devolve { data, errors }, com errors = { campo: 'mensagem' }
// (uma mensagem por campo, para mostrar junto do input correspondente)
export function validate(schema, values) {
  const result = schema.safeParse(values)
  if (result.success) return { data: result.data, errors: {} }
  const errors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (field && !errors[field]) errors[field] = issue.message
  }
  return { data: null, errors }
}