const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Novosibirsk',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date(iso))
      .replace(',', '');
  } catch {
    return iso;
  }
}

export const CATEGORIES = [
  'Инструменты ИИ',
  'Скилы и правила для Агентов',
  'Монетизация с помощью ИИ',
  'Прочее',
] as const;