export function clamp(val, min, max) {
  const num = Number(val);
  if (Number.isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
}

export function calcAttrMod(score, extraBonus = 0) {
  const s = Number(score) || 10;
  const b = Number(extraBonus) || 0;
  return Math.floor((s - 10) / 2) + b;
}

export function formatSigned(num) {
  const n = Number(num) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
}

export function calcPercentage(current, max) {
  const c = Number(current) || 0;
  const m = Math.max(1, Number(max) || 1);
  return clamp(Math.round((c / m) * 100), 0, 100);
}

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function setInputValueIfNotFocused(elementId, value) {
  const el = document.getElementById(elementId);
  if (el && document.activeElement !== el) {
    el.value = value;
  }
}

export function isUserTypingInContainer(containerEl) {
  if (!containerEl || !document.activeElement) return false;
  const active = document.activeElement;
  const tag = (active.tagName || '').toLowerCase();
  if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return false;
  if (tag === 'input' && ['checkbox', 'radio', 'button', 'submit', 'range', 'color', 'file'].includes((active.type || '').toLowerCase())) {
    return false;
  }
  return containerEl.contains(active);
}

export function isUserTypingAnywhere() {
  if (!document.activeElement) return false;
  const active = document.activeElement;
  const tag = (active.tagName || '').toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') return false;
  if (tag === 'input' && ['checkbox', 'radio', 'button', 'submit', 'range', 'color', 'file'].includes((active.type || '').toLowerCase())) {
    return false;
  }
  return true;
}

export async function sha256Hash(text) {
  const normalized = String(text || '').trim();
  try {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(normalized);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (_) {}
  let h = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a_${(h >>> 0).toString(16)}`;
}