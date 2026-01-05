import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  DB: D1Database;
  MAILCHANNELS_API_KEY?: string;
  MY_DAILY_FROM_EMAIL?: string;
  MY_DAILY_REPLY_DOMAIN?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin) => origin || '*',
  allowHeaders: ['Content-Type'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

const DEFAULT_FROM = 'hello@liuallen.com';
const DEFAULT_REPLY_DOMAIN = 'liuallen.com';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function parseTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function getLocalParts(timeZone: string, date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: Number(map.hour ?? 0),
    minute: Number(map.minute ?? 0),
    weekday: weekdayMap[map.weekday ?? 'Sun'] ?? 0,
  };
}

function getLocalDateKey(timeZone: string, date: Date) {
  const parts = getLocalParts(timeZone, date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function computeNextSend(timeZone: string, frequency: string, sendTime: string) {
  const now = new Date();
  const localParts = getLocalParts(timeZone, now);
  const send = parseTime(sendTime);
  if (!send) return null;

  const target = new Date(now);
  target.setUTCFullYear(Number(localParts.year));
  target.setUTCMonth(Number(localParts.month) - 1);
  target.setUTCDate(Number(localParts.day));
  target.setUTCHours(send.hours, send.minutes, 0, 0);

  const localNowMinutes = localParts.hour * 60 + localParts.minute;
  const sendMinutes = send.hours * 60 + send.minutes;

  if (localNowMinutes >= sendMinutes) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  if (frequency === 'weekdays') {
    while ([0, 6].includes(getLocalParts(timeZone, target).weekday)) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
  }

  if (frequency === 'weekly') {
    target.setUTCDate(target.getUTCDate() + 7);
  }

  return target;
}

async function sendReminder(env: Env, payload: { email: string; prompt: string; replyTo: string; subject: string }) {
  if (!env.MAILCHANNELS_API_KEY) {
    throw new Error('Missing MAILCHANNELS_API_KEY');
  }
  const fromEmail = env.MY_DAILY_FROM_EMAIL || DEFAULT_FROM;
  const mailPayload = {
    personalizations: [{ to: [{ email: payload.email }] }],
    from: { email: fromEmail, name: 'My Daily' },
    reply_to: { email: payload.replyTo, name: 'My Daily Replies' },
    subject: payload.subject,
    content: [
      {
        type: 'text/plain',
        value: `${payload.prompt}\n\n直接回复这封邮件记录你的日程。`,
      },
      {
        type: 'text/html',
        value: `<p>${payload.prompt}</p><p>直接回复这封邮件记录你的日程。</p>`,
      },
    ],
  };

  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.MAILCHANNELS_API_KEY}`,
      'x-api-key': env.MAILCHANNELS_API_KEY,
    },
    body: JSON.stringify(mailPayload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mail send failed: ${res.status} ${text}`);
  }
}

app.get('/my-daily/health', (c) => c.json({ ok: true }));

app.post('/my-daily/schedules', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = String(body?.email || '').trim();
  const timeZone = String(body?.timeZone || '').trim();
  const sendTime = String(body?.sendTime || '').trim();
  const frequency = String(body?.frequency || 'daily').trim();
  const prompt = String(body?.prompt || '').trim();

  if (!email || !isValidEmail(email)) {
    return c.json({ ok: false, error: '请输入有效邮箱。' }, 400);
  }
  if (!timeZone) {
    return c.json({ ok: false, error: '缺少时区信息。' }, 400);
  }
  if (!parseTime(sendTime)) {
    return c.json({ ok: false, error: '时间格式应为 HH:MM。' }, 400);
  }
  if (!['daily', 'weekdays', 'weekly'].includes(frequency)) {
    return c.json({ ok: false, error: '无效的发送频率。' }, 400);
  }
  if (!prompt || prompt.length > 1000) {
    return c.json({ ok: false, error: '请输入 1-1000 字的提醒内容。' }, 400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const weekday = getLocalParts(timeZone, new Date()).weekday;
  const nextSend = computeNextSend(timeZone, frequency, sendTime);

  await c.env.DB.prepare(
    `INSERT INTO my_daily_schedules (id, email, timezone, send_time, frequency, prompt, send_weekday, created_at, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
  )
    .bind(id, email, timeZone, sendTime, frequency, prompt, weekday, createdAt)
    .run();

  return c.json({
    ok: true,
    schedule: {
      id,
      email,
      timeZone,
      sendTime,
      frequency,
      prompt,
      nextSendAt: nextSend ? nextSend.toISOString() : null,
    },
  });
});

app.post('/my-daily/test', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const scheduleId = String(body?.scheduleId || '').trim();
  const email = String(body?.email || '').trim();
  const prompt = String(body?.prompt || '').trim();

  if (!email || !isValidEmail(email)) {
    return c.json({ ok: false, error: '请输入有效邮箱。' }, 400);
  }
  const replyDomain = c.env.MY_DAILY_REPLY_DOMAIN || DEFAULT_REPLY_DOMAIN;
  const replyTo = scheduleId ? `reply+${scheduleId}@${replyDomain}` : `reply@${replyDomain}`;
  const subject = `My Daily · ${new Date().toLocaleDateString('zh-CN')}`;

  try {
    await sendReminder(c.env, { email, prompt, replyTo, subject });
    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '发送失败';
    return c.json({ ok: false, error: message }, 502);
  }
});

export default app;

export const scheduled: ExportedHandlerScheduledHandler<Env> = async (_event, env) => {
  const now = new Date();
  const { results } = await env.DB.prepare(
    `SELECT id, email, timezone, send_time as sendTime, frequency, prompt, send_weekday as sendWeekday, last_sent_at as lastSentAt
     FROM my_daily_schedules WHERE active = 1`
  ).all();

  for (const row of results as any[]) {
    const timeZone = row.timezone;
    const send = parseTime(row.sendTime);
    if (!send) continue;

    const localParts = getLocalParts(timeZone, now);
    const localMinutes = localParts.hour * 60 + localParts.minute;
    const sendMinutes = send.hours * 60 + send.minutes;

    if (row.frequency === 'weekdays' && (localParts.weekday === 0 || localParts.weekday === 6)) {
      continue;
    }

    if (row.frequency === 'weekly' && row.sendWeekday !== localParts.weekday) {
      continue;
    }

    if (localMinutes < sendMinutes) {
      continue;
    }

    if (row.lastSentAt) {
      const lastDateKey = getLocalDateKey(timeZone, new Date(row.lastSentAt));
      const todayKey = `${localParts.year}-${localParts.month}-${localParts.day}`;
      if (lastDateKey === todayKey) {
        continue;
      }
    }

    const replyDomain = env.MY_DAILY_REPLY_DOMAIN || DEFAULT_REPLY_DOMAIN;
    const replyTo = `reply+${row.id}@${replyDomain}`;
    const subject = `My Daily · ${localParts.year}-${localParts.month}-${localParts.day}`;

    try {
      await sendReminder(env, { email: row.email, prompt: row.prompt, replyTo, subject });
      await env.DB.prepare('UPDATE my_daily_schedules SET last_sent_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), row.id)
        .run();
    } catch (err) {
      console.error('my-daily send failed', row.id, err);
    }
  }
};

export const email: ExportedHandlerEmailHandler<Env> = async (message, env) => {
  const recipient = message.to;
  const match = recipient.match(/reply\+([a-z0-9-]+)@/i);
  const scheduleId = match ? match[1] : null;
  const subject = message.headers.get('subject') || '';
  const from = message.from || '';
  const raw = await new Response(message.raw).text();
  const body = raw.split('\n\n').slice(1).join('\n\n').slice(0, 5000);

  await env.DB.prepare(
    `INSERT INTO my_daily_entries (id, schedule_id, from_email, subject, body, received_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(crypto.randomUUID(), scheduleId, from, subject, body, new Date().toISOString())
    .run();
};
