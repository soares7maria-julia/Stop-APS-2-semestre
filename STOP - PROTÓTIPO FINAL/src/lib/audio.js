let context
let musicTimer
let enabled = false
let note = 0
// Tema original em estilo arcade, com contratempo e baixo para dar energia ao jogo.
const melody = [523, 659, 784, 659, 587, 784, 880, 784, 523, 659, 784, 1047, 988, 784, 659, 784,
  587, 740, 880, 740, 659, 880, 988, 880, 587, 740, 880, 1175, 1047, 880, 740, 659]

function audioContext() {
  if (!context) context = new (window.AudioContext || window.webkitAudioContext)()
  if (context.state === 'suspended') context.resume()
  return context
}

function tone(frequency, duration = 0.14, type = 'triangle', volume = 0.035) {
  if (!enabled || typeof window === 'undefined') return
  const ctx = audioContext()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  oscillator.connect(gain); gain.connect(ctx.destination)
  oscillator.start(); oscillator.stop(ctx.currentTime + duration)
}

export function setAudioEnabled(value) {
  enabled = !!value
  try { localStorage.setItem('stop-audio-enabled', String(enabled)) } catch {}
  clearInterval(musicTimer)
  musicTimer = undefined
  if (enabled) {
    note = 0
    const playNote = () => {
      const frequency = melody[note % melody.length]
      tone(frequency, 0.15, note % 2 ? 'square' : 'triangle', 0.024)
      if (note % 4 === 0) {
        tone(melody[(note + 8) % melody.length] / 2, 0.32, 'triangle', 0.022)
        tone(110, 0.07, 'sine', 0.018)
      }
      note++
    }
    playNote()
    musicTimer = setInterval(playNote, 180)
  }
}

export function getAudioEnabled() {
  try { return localStorage.getItem('stop-audio-enabled') === 'true' } catch { return false }
}

export function playGameSound(name) {
  if (!enabled) return
  const patterns = {
    stop: [[740, .12], [988, .2]], victory: [[523, .12], [659, .12], [784, .12], [1047, .35]],
    failure: [[392, .18], [330, .2], [262, .28]], reveal: [[587, .1], [784, .18]],
  }
  ;(patterns[name] ?? []).forEach(([frequency, duration], index) => setTimeout(() => tone(frequency, duration, 'square', .04), index * 115))
}
