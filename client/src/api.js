export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
export const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

export async function fetchHoofdstukken() {
  const res = await fetch(`${API_BASE}/api/hoofdstukken`);
  if (!res.ok) throw new Error('kon hoofdstukken niet laden');
  return res.json();
}

export async function fetchHoofdstuk(id) {
  const res = await fetch(`${API_BASE}/api/hoofdstukken/${id}`);
  if (!res.ok) throw new Error('kon hoofdstuk niet laden');
  return res.json();
}

export async function fetchIntro() {
  const res = await fetch(`${API_BASE}/api/content/intro`);
  if (!res.ok) throw new Error('kon intro.md niet laden');
  return res.json();
}

export async function fetchShowcases() {
  const res = await fetch(`${API_BASE}/api/content/showcases`);
  if (!res.ok) throw new Error('kon showcases.json niet laden');
  return res.json();
}
