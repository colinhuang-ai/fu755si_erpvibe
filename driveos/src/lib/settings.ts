import type { Settings } from '../types';

/** Cài đặt theo thiết bị (giao diện, chế độ lái) — lưu cục bộ, không đồng bộ lên server */
const KEY = 'driveros.settings';
const DEFAULT: Settings = { theme: 'auto', push: true, driving: false };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch { /* ignore */ }
  return { ...DEFAULT };
}

export function saveSettings(s: Settings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function applyTheme(theme: Settings['theme']) {
  const el = document.documentElement;
  if (theme === 'auto') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', theme);
}
