// Pontuação de uma rodada. Hoje: resposta preenchida e começando com a letra sorteada = 10 pts.
// Respostas repetidas (5 pts) e contestação dependem dos outros jogadores da sala (partida em tempo real).
const strip = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()

export function answerText(raw) {
  if (raw && typeof raw === 'object') return String(raw.value ?? '')
  return String(raw ?? '')
}

export function isValidAnswer(raw, letter) {
  const text = strip(answerText(raw))
  return text.length > 0 && text[0] === strip(letter)
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