let soundEnabled = true;

export function isSoundEnabled() {
  return soundEnabled;
}

export function toggleSoundState() {
  soundEnabled = !soundEnabled;
  const icon = document.getElementById('soundIcon');
  if (icon) {
    icon.className = soundEnabled
      ? 'fa-solid fa-volume-high text-sm text-brass-300'
      : 'fa-solid fa-volume-xmark text-sm text-slate-500';
  }
  showToast(soundEnabled ? 'Efeitos sonoros ativados' : 'Efeitos sonoros silenciados');
}

export function playDiceSound(isCrit = false, isFail = false) {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [0, 0.06, 0.13].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCrit ? 'triangle' : (isFail ? 'sawtooth' : 'sine');
      const baseFreq = isCrit ? 520 + idx * 180 : (isFail ? 220 - idx * 40 : 300 + idx * 70);
      osc.frequency.setValueAtTime(baseFreq, now + offset);
      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.09);
    });
  } catch (_) {}
}

export function playCombatAlarmSound(starting = true) {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (starting) {
      // Acorde grave e macabro quando o combate inicia
      [110, 116.54, 164.81].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.65);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.72);
      });
    } else {
      // Tom etéreo de alívio quando o combate termina
      [330, 440, 554.37].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.05, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.38);
      });
    }
  } catch (_) {}
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const colorClasses = type === 'crit'
    ? 'bg-amber-950/95 border-amber-400 text-amber-200'
    : type === 'error'
    ? 'bg-crimson-950/95 border-crimson-500 text-crimson-200'
    : 'bg-obsidian-800/95 border-brass-400/50 text-slate-100';

  toast.className = `px-4 py-2.5 rounded-xl border shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-all duration-300 ${colorClasses}`;
  toast.innerHTML = `<i class="fa-solid fa-sparkles text-brass-400"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}