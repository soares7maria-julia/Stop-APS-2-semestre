// Pontuação de uma rodada. Hoje: resposta com pelo menos 2 letras, começando com a letra sorteada = 10 pts.
// (Só a letra inicial, que o campo já traz preenchida, não conta como resposta.)
// Respostas repetidas (5 pts) e contestação dependem dos outros jogadores da partida.
export const normalizeText = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()

export function answerText(raw) {
  if (raw && typeof raw === 'object') return String(raw.value ?? '')
  return String(raw ?? '')
}

export function isValidAnswer(raw, letter) {
  const text = normalizeText(answerText(raw))
  return text.length >= 2 && text[0] === normalizeText(letter)
}

export function scoreRound(answers, categories, letter) {
  const breakdown = {}
  let total = 0
  for (const category of categories) {
    const pts = isValidAnswer(answers?.[category], letter) ? 10 : 0
    breakdown[category] = pts
    total += pts
  }
  return { breakdown, total }
}