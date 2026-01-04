export interface User {
  id: string;
  email: string;
  timezone?: string | null;
}

export interface Entry {
  id: string;
  subject: string | null;
  text_content: string | null;
  html_content: string | null;
  created_at: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  r2_key: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time_of_day: string;
  timezone: string;
  day_of_week: number | null;
  day_of_month: number | null;
  next_run_at: string;
  paused: number;
}

export type ContactTopic = 'Investing' | 'Partnership' | 'Media' | 'Events' | 'Build Studio' | 'Other';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8787';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return (await res.json()) as T;
}

export function requestMagicLink(email: string, timezone: string) {
  return http<{ ok: boolean }>('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email, timezone }),
  });
}

export function fetchSession() {
  return http<{ user: User | null }>('/auth/session', {
    method: 'GET',
  });
}

export function logout() {
  return http<{ ok: boolean }>('/auth/logout', {
    method: 'POST',
  });
}

export function fetchEntries(search?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const query = params.toString();
  return http<{ entries: Entry[] }>(`/entries${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

export function fetchReminders() {
  return http<{ reminders: Reminder[] }>('/reminders', {
    method: 'GET',
  });
}

export function createReminder(input: {
  frequency: Reminder['frequency'];
  timeOfDay: string;
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}) {
  return http<{ ok: boolean; id: string }>('/reminders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateReminder(id: string, input: Partial<{
  frequency: Reminder['frequency'];
  timeOfDay: string;
  timezone: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  paused: boolean;
}>) {
  return http<{ ok: boolean }>(`/reminders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteReminder(id: string) {
  return http<{ ok: boolean }>(`/reminders/${id}`, {
    method: 'DELETE',
  });
}

export function exportEntries() {
  return http<{ entries: Array<{ entry: Entry; assets: Attachment[] }> }>('/export', {
    method: 'GET',
  });
}

export function assetUrl(entryId: string, assetId: string) {
  return `${API_BASE}/entries/${entryId}/assets/${assetId}`;
}

export function submitContactMessage(input: {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}) {
  return http<{ ok: boolean }>('/contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
