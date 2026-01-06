import { Hono } from 'hono';
import type { Context } from 'hono';
import type { EmailMessage } from '@cloudflare/workers-types';
import { getCookie, setCookie } from 'hono/cookie';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';

type Frequency = 'daily' | 'weekly' | 'monthly';

type ReminderRow = {
  id: string;
  user_id: string;
  frequency: Frequency;
  time_of_day: string;
  timezone: string;
  day_of_week: number | null;
  day_of_month: number | null;
  next_run_at: string;
  paused: number;
};

type EntryRow = {
  id: string;
  user_id: string;
  subject: string | null;
  text_content: string | null;
  html_content: string | null;
  created_at: string;
};

type AssetRow = {
  id: string;
  entry_id: string;
  filename: string;
  content_type: string;
  size: number;
  r2_key: string;
  created_at: string;
};

type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  created_at: string;
};

type MyDailyScheduleRow = {
  id: string;
  email: string;
  timezone: string;
  send_time: string;
  frequency: 'daily' | 'weekdays' | 'weekly';
  prompt: string;
  send_weekday: number;
  last_sent_at: string | null;
  active: number;
};

interface SessionData {
  userId: string;
  expiresAt: string;
}

interface Env extends Record<string, unknown> {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  KV_SESSIONS: KVNamespace;
  MAIL_FROM: string;
  APP_BASE_URL: string;
  API_BASE_URL: string;
  COOKIE_DOMAIN: string;
  MAGIC_LINK_EXP_MINUTES?: string;
  MAILCHANNELS_API_KEY?: string;
  MAILCHANNELS_API_URL?: string;
  MY_DAILY_FROM_EMAIL?: string;
  MY_DAILY_REPLY_DOMAIN?: string;
  MY_DAILY_APP_BASE_URL?: string;
}

const SESSION_COOKIE = 'maildiary_session';
const MAGIC_LINK_TTL_MINUTES = 30;
const MAGIC_LINK_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const MAGIC_LINK_RATE_LIMIT_MAX_PER_EMAIL = 5;
const MAGIC_LINK_RATE_LIMIT_MAX_PER_IP = 20;

const toIsoString = (date: DateTime) => date.toUTC().toISO() ?? new Date().toISOString();
const MY_DAILY_DEFAULT_FROM = 'hello@liuallen.com';
const MY_DAILY_DEFAULT_REPLY_DOMAIN = 'liuallen.com';
const MY_DAILY_DEFAULT_APP_ORIGIN = 'https://liuallen.com';

type AppVariables = { userId?: string; userEmail?: string };
type HonoBindings = { Bindings: Env; Variables: AppVariables };

const app = new Hono<HonoBindings>();

const DEFAULT_ALLOWED_ORIGINS = ['https://maildiary-web.pages.dev'];

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  const allowedOrigins = [
    c.env.APP_BASE_URL,
    c.env.MY_DAILY_APP_BASE_URL ?? MY_DAILY_DEFAULT_APP_ORIGIN,
    ...DEFAULT_ALLOWED_ORIGINS,
  ].filter(Boolean) as string[];
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false;

  if (c.req.method === 'OPTIONS') {
    if (isAllowedOrigin) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': c.req.header('Access-Control-Request-Headers') ?? 'Content-Type',
          Vary: 'Origin',
        },
      });
    }
    return new Response(null, { status: 204 });
  }

  await next();

  if (isAllowedOrigin) {
    c.header('Access-Control-Allow-Origin', origin!);
    c.header('Access-Control-Allow-Credentials', 'true');
  }
  c.header('Vary', 'Origin', { append: true });
});

app.use('*', async (c, next) => {
  const cookie = getCookie(c, SESSION_COOKIE);
  if (cookie) {
    const data = await c.env.KV_SESSIONS.get<SessionData>(cookie, 'json');
    if (data && DateTime.fromISO(data.expiresAt) > DateTime.utc()) {
      const row = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(data.userId).first<{ email: string }>();
      if (row) {
        c.set('userId', data.userId);
        c.set('userEmail', row.email);
      }
    }
  }
  await next();
});

app.get('/health', (c) => c.json({ ok: true }));

app.post('/contact', async (c) => {
  const body = await c.req.json<{ name?: string; email?: string; topic?: string; message?: string }>();
  const name = body.name?.trim();
  const email = body.email?.trim();
  const topic = body.topic?.trim();
  const message = body.message?.trim();

  if (!name || !email || !topic || !message) {
    return c.json({ ok: false, error: 'Missing fields' }, 400);
  }

  const createdAt = toIsoString(DateTime.utc());
  const id = uuid();

  await c.env.DB.prepare(
    'INSERT INTO contact_messages (id, name, email, topic, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, name, email, topic, message, createdAt)
    .run();

  return c.json({ ok: true });
});

function myDailyIsValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function myDailyParseTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function myDailyGetLocalParts(timeZone: string, date: Date) {
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

function myDailyGetLocalDateKey(timeZone: string, date: Date) {
  const parts = myDailyGetLocalParts(timeZone, date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function myDailyFrequencyLabel(frequency: string) {
  if (frequency === 'weekdays') return '工作日';
  if (frequency === 'weekly') return '每周';
  return '每日';
}

function myDailyComputeNextSend(timeZone: string, frequency: string, sendTime: string) {
  const now = new Date();
  const localParts = myDailyGetLocalParts(timeZone, now);
  const send = myDailyParseTime(sendTime);
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
    while ([0, 6].includes(myDailyGetLocalParts(timeZone, target).weekday)) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
  }

  if (frequency === 'weekly') {
    target.setUTCDate(target.getUTCDate() + 7);
  }

  return target;
}

async function sendMyDailyReminder(
  env: Env,
  payload: { email: string; prompt: string; replyTo: string; subject: string },
) {
  if (!env.MAILCHANNELS_API_KEY) {
    throw new Error('MAILCHANNELS_API_KEY missing');
  }
  const endpoint = env.MAILCHANNELS_API_URL ?? 'https://api.mailchannels.net/tx/v1/send';
  const fromEmail = env.MY_DAILY_FROM_EMAIL ?? MY_DAILY_DEFAULT_FROM;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${env.MAILCHANNELS_API_KEY}`,
      'x-api-key': env.MAILCHANNELS_API_KEY,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.email }] }],
      from: { email: fromEmail, name: 'My Daily' },
      reply_to: { email: payload.replyTo, name: 'My Daily Replies' },
      subject: payload.subject,
      content: [
        { type: 'text/plain', value: `${payload.prompt}\n\n直接回复这封邮件记录你的日程。` },
        { type: 'text/html', value: `<p>${payload.prompt}</p><p>直接回复这封邮件记录你的日程。</p>` },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mail send failed: ${res.status} ${text}`);
  }
}

app.get('/my-daily/health', (c) => c.json({ ok: true }));

app.post('/my-daily/schedules', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = String(body?.email ?? '').trim();
  const timeZone = String(body?.timeZone ?? '').trim();
  const sendTime = String(body?.sendTime ?? '').trim();
  const frequency = String(body?.frequency ?? 'daily').trim();
  const prompt = String(body?.prompt ?? '').trim();

  if (!email || !myDailyIsValidEmail(email)) {
    return c.json({ ok: false, error: '请输入有效邮箱。' }, 400);
  }
  if (!timeZone) {
    return c.json({ ok: false, error: '缺少时区信息。' }, 400);
  }
  if (!myDailyParseTime(sendTime)) {
    return c.json({ ok: false, error: '时间格式应为 HH:MM。' }, 400);
  }
  if (!['daily', 'weekdays', 'weekly'].includes(frequency)) {
    return c.json({ ok: false, error: '无效的发送频率。' }, 400);
  }
  if (!prompt || prompt.length > 1000) {
    return c.json({ ok: false, error: '请输入 1-1000 字的提醒内容。' }, 400);
  }

  const id = uuid();
  const createdAt = toIsoString(DateTime.utc());
  const weekday = myDailyGetLocalParts(timeZone, new Date()).weekday;
  const nextSend = myDailyComputeNextSend(timeZone, frequency, sendTime);

  await c.env.DB.prepare(
    `INSERT INTO my_daily_schedules (id, email, timezone, send_time, frequency, prompt, send_weekday, created_at, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
  )
    .bind(id, email, timeZone, sendTime, frequency, prompt, weekday, createdAt)
    .run();

  let emailError: string | null = null;
  const replyDomain = c.env.MY_DAILY_REPLY_DOMAIN ?? MY_DAILY_DEFAULT_REPLY_DOMAIN;
  const replyTo = `reply+${id}@${replyDomain}`;
  const subject = 'My Daily 已启用';
  const welcomePrompt = `你的 My Daily 提醒已创建。之后我们会在 ${sendTime}（${timeZone}）按「${myDailyFrequencyLabel(
    frequency,
  )}」发送提醒。\n\n现在就可以直接回复这封邮件，记录今天的日程。`;

  try {
    await sendMyDailyReminder(c.env, { email, prompt: welcomePrompt, replyTo, subject });
  } catch (err) {
    emailError = err instanceof Error ? err.message : '发送失败';
  }

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
    emailStatus: emailError ? { ok: false, error: emailError } : { ok: true },
  });
});

app.post('/my-daily/test', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const scheduleId = String(body?.scheduleId ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const prompt = String(body?.prompt ?? '').trim();

  if (!email || !myDailyIsValidEmail(email)) {
    return c.json({ ok: false, error: '请输入有效邮箱。' }, 400);
  }
  if (!prompt) {
    return c.json({ ok: false, error: '提醒内容不能为空。' }, 400);
  }

  const replyDomain = c.env.MY_DAILY_REPLY_DOMAIN ?? MY_DAILY_DEFAULT_REPLY_DOMAIN;
  const replyTo = scheduleId ? `reply+${scheduleId}@${replyDomain}` : `reply@${replyDomain}`;
  const subject = `My Daily · ${new Date().toLocaleDateString('zh-CN')}`;

  try {
    await sendMyDailyReminder(c.env, { email, prompt, replyTo, subject });
    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '发送失败';
    return c.json({ ok: false, error: message }, 502);
  }
});

app.post('/auth/magic-link', async (c) => {
  const body = await c.req.json<{ email?: string; timezone?: string }>();
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return c.json({ error: 'Invalid email' }, 400);
  }
  const ip =
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    null;
  if (ip) {
    const ipLimit = await touchRateLimit(
      c.env.KV_SESSIONS,
      `magiclink:ip:${ip}`,
      MAGIC_LINK_RATE_LIMIT_MAX_PER_IP,
      MAGIC_LINK_RATE_LIMIT_WINDOW_SECONDS,
    );
    if (!ipLimit.allowed) {
      const retryAfter = Math.max(ipLimit.retryAfter, 1);
      return c.json(
        { error: 'Too many requests from this network. Please try again later.' },
        429,
        { 'Retry-After': retryAfter.toString() },
      );
    }
  }
  const emailLimit = await touchRateLimit(
    c.env.KV_SESSIONS,
    `magiclink:email:${email}`,
    MAGIC_LINK_RATE_LIMIT_MAX_PER_EMAIL,
    MAGIC_LINK_RATE_LIMIT_WINDOW_SECONDS,
  );
  if (!emailLimit.allowed) {
    const retryAfter = Math.max(emailLimit.retryAfter, 1);
    return c.json(
      { error: 'Too many magic link requests. Please wait a few minutes and try again.' },
      429,
      { 'Retry-After': retryAfter.toString() },
    );
  }
  const timezone = body.timezone ?? 'UTC';
  let user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
  if (!user) {
    const userId = uuid();
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, timezone, created_at) VALUES (?, ?, ?, ?)',
    )
      .bind(userId, email, timezone, toIsoString(DateTime.utc()))
      .run();
    user = { id: userId };
  }

  const token = uuid();
  const expiresAt = toIsoString(
    DateTime.utc().plus({ minutes: Number(c.env.MAGIC_LINK_EXP_MINUTES ?? MAGIC_LINK_TTL_MINUTES) }),
  );
  await c.env.DB.prepare(
    'INSERT INTO magic_links (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  )
    .bind(token, user.id, expiresAt, toIsoString(DateTime.utc()))
    .run();

  const verifyUrl = `${c.env.API_BASE_URL}/auth/verify?token=${token}`;
  const response = await sendMail(c.env, {
    to: email,
    subject: 'Your MailDiary magic link',
    text: `Click to sign in: ${verifyUrl}\nThis link expires in 30 minutes.`,
    html: `<p>Click to sign in:</p><p><a href="${verifyUrl}">Open MailDiary</a></p><p>This link expires in 30 minutes.</p>`,
  });
  if (!response.ok) {
    console.error('Failed to send magic link', await response.text());
    return c.json({ error: 'Unable to send email' }, 502);
  }

  return c.json({ ok: true });
});

app.get('/auth/verify', async (c) => {
  const token = c.req.query('token');
  if (!token) {
    return c.json({ error: 'Token missing' }, 400);
  }
  const row = await c.env.DB.prepare(
    'SELECT magic_links.user_id AS user_id, magic_links.expires_at AS expires_at, users.email AS email FROM magic_links JOIN users ON users.id = magic_links.user_id WHERE magic_links.token = ?',
  )
    .bind(token)
    .first<{ user_id: string; expires_at: string; email: string }>();
  if (!row) {
    return c.json({ error: 'Invalid token' }, 400);
  }
  if (DateTime.fromISO(row.expires_at) < DateTime.utc()) {
    await c.env.DB.prepare('DELETE FROM magic_links WHERE token = ?').bind(token).run();
    return c.json({ error: 'Token expired' }, 400);
  }
  await c.env.DB.prepare('DELETE FROM magic_links WHERE token = ?').bind(token).run();

  const sessionId = uuid();
  const expiresAt = toIsoString(DateTime.utc().plus({ days: 30 }));
  const session: SessionData = { userId: row.user_id, expiresAt };
  await c.env.KV_SESSIONS.put(sessionId, JSON.stringify(session), {
    expirationTtl: 60 * 60 * 24 * 30,
  });

  setCookie(c, SESSION_COOKIE, sessionId, {
    domain: c.env.COOKIE_DOMAIN,
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return c.redirect(`${c.env.APP_BASE_URL}/dashboard`);
});

app.post('/auth/logout', async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) {
    await c.env.KV_SESSIONS.delete(sessionId);
    setCookie(c, SESSION_COOKIE, '', {
      domain: c.env.COOKIE_DOMAIN,
      path: '/',
      maxAge: 0,
    });
  }
  return c.json({ ok: true });
});

app.get('/auth/session', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ user: null });
  }
  const row = await c.env.DB.prepare(
    'SELECT id, email, timezone FROM users WHERE id = ?',
  )
    .bind(userId)
    .first<{ id: string; email: string; timezone: string | null }>();
  return c.json({
    user: row ?? null,
  });
});

function requireAuth(c: Context<HonoBindings>) {
  const userId = c.get('userId');
  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }
  return userId;
}

app.get('/entries', async (c) => {
  try {
    const userId = requireAuth(c);
    const search = c.req.query('search');
    let query =
      'SELECT id, subject, text_content, html_content, created_at FROM entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 100';
    let bindings: unknown[] = [userId];
    if (search) {
      query =
        'SELECT id, subject, text_content, html_content, created_at FROM entries WHERE user_id = ? AND (subject LIKE ? OR text_content LIKE ?) ORDER BY created_at DESC LIMIT 100';
      bindings = [userId, `%${search}%`, `%${search}%`];
    }
    const { results } = await c.env.DB.prepare(query).bind(...bindings).all<EntryRow>();
    const entries = await Promise.all(
      results.map(async (entry) => {
        const attachments = await c.env.DB.prepare(
          'SELECT id, filename, content_type, size, r2_key, created_at FROM entry_assets WHERE entry_id = ? ORDER BY created_at ASC',
        )
          .bind(entry.id)
          .all<AssetRow>();
        return {
          ...entry,
          attachments: attachments.results,
        };
      }),
    );
    return c.json({ entries });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    console.error(error);
    return c.json({ error: 'Internal error' }, 500);
  }
});

app.get('/entries/:id/assets/:assetId', async (c) => {
  try {
    const userId = requireAuth(c);
    const { id, assetId } = c.req.param();
    const asset = await c.env.DB.prepare(
      'SELECT entry_assets.*, entries.user_id FROM entry_assets JOIN entries ON entries.id = entry_assets.entry_id WHERE entry_assets.id = ? AND entry_assets.entry_id = ?',
    )
      .bind(assetId, id)
      .first<AssetRow & { user_id: string }>();
    if (!asset || asset.user_id !== userId) {
      return c.json({ error: 'Not found' }, 404);
    }
    const object = await c.env.R2_BUCKET.get(asset.r2_key);
    if (!object) {
      return c.json({ error: 'Asset not found' }, 404);
    }
    return new Response(object.body, {
      headers: {
        'content-type': asset.content_type,
        'content-length': object.size.toString(),
        'cache-control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    console.error(error);
    return c.json({ error: 'Internal error' }, 500);
  }
});

app.get('/reminders', async (c) => {
  try {
    const userId = requireAuth(c);
    const { results } = await c.env.DB.prepare(
      'SELECT id, frequency, time_of_day, timezone, day_of_week, day_of_month, next_run_at, paused FROM reminders WHERE user_id = ? ORDER BY created_at DESC',
    )
      .bind(userId)
      .all<ReminderRow>();
    return c.json({ reminders: results });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    console.error(error);
    return c.json({ error: 'Internal error' }, 500);
  }
});

app.post('/reminders', async (c) => {
  try {
    const userId = requireAuth(c);
    const body = await c.req.json<{
      frequency: Frequency;
      timeOfDay: string;
      timezone: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
    }>();
    const id = uuid();
    const nextRun = computeNextRun(
      body.frequency,
      body.timeOfDay,
      body.timezone,
      body.dayOfWeek,
      body.dayOfMonth,
    );
    await c.env.DB.prepare(
      'INSERT INTO reminders (id, user_id, frequency, time_of_day, timezone, day_of_week, day_of_month, next_run_at, paused, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
    )
      .bind(
        id,
        userId,
        body.frequency,
        body.timeOfDay,
        body.timezone,
        body.dayOfWeek ?? null,
        body.dayOfMonth ?? null,
        toIsoString(nextRun),
        toIsoString(DateTime.utc()),
      )
      .run();
    return c.json({ ok: true, id });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    console.error(error);
    return c.json({ error: 'Internal error' }, 500);
  }
});

app.patch('/reminders/:id', async (c) => {
  try {
    const userId = requireAuth(c);
    const { id } = c.req.param();
    const body = await c.req.json<{
      frequency?: Frequency;
      timeOfDay?: string;
      timezone?: string;
      dayOfWeek?: number | null;
      dayOfMonth?: number | null;
      paused?: boolean;
    }>();
    const row = await c.env.DB.prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first<ReminderRow>();
    if (!row) {
      return c.json({ error: 'Not found' }, 404);
    }
    const frequency = body.frequency ?? row.frequency;
    const timeOfDay = body.timeOfDay ?? row.time_of_day;
    const timezone = body.timezone ?? row.timezone;
    const dayOfWeek = body.dayOfWeek ?? row.day_of_week;
    const dayOfMonth = body.dayOfMonth ?? row.day_of_month;
    const paused = body.paused ?? Boolean(row.paused);
    const nextRun = computeNextRun(frequency, timeOfDay, timezone, dayOfWeek ?? undefined, dayOfMonth ?? undefined);
    await c.env.DB.prepare(
      'UPDATE reminders SET frequency = ?, time_of_day = ?, timezone = ?, day_of_week = ?, day_of_month = ?, paused = ?, next_run_at = ? WHERE id = ? AND user_id = ?'
    )
      .bind(
        frequency,
        timeOfDay,
        timezone,
        dayOfWeek ?? null,
        dayOfMonth ?? null,
        paused ? 1 : 0,
        toIsoString(nextRun),
        id,
        userId,
      )
      .run();
    return c.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    console.error(error);
    return c.json({ error: 'Internal error' }, 500);
  }
});

app.delete('/reminders/:id', async (c) => {
  try {
    const userId = requireAuth(c);
    const { id } = c.req.param();
    await c.env.DB.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();
    return c.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    console.error(error);
    return c.json({ error: 'Internal error' }, 500);
  }
});

async function sendMail(env: Env, mail: { to: string; subject: string; text: string; html: string; replyTo?: string }) {
  if (!env.MAILCHANNELS_API_KEY) {
    console.warn('MAILCHANNELS_API_KEY is not configured; email delivery is disabled.');
    return new Response('MAILCHANNELS_API_KEY missing', { status: 500 });
  }
  const endpoint = env.MAILCHANNELS_API_URL ?? 'https://api.mailchannels.net/tx/v1/send';
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${env.MAILCHANNELS_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: mail.to }],
        },
      ],
      from: {
        email: env.MAIL_FROM,
        name: 'MailDiary',
      },
      reply_to: mail.replyTo
        ? {
            email: mail.replyTo,
            name: 'MailDiary',
          }
        : undefined,
      subject: mail.subject,
      content: [
        { type: 'text/plain', value: mail.text },
        { type: 'text/html', value: mail.html },
      ],
    }),
  });
}

type RateLimitState = { count: number; resetAt: number };

async function touchRateLimit(
  kv: KVNamespace,
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const now = Math.floor(Date.now() / 1000);
  const state = await kv.get<RateLimitState>(key, 'json');
  if (state && state.resetAt > now) {
    if (state.count >= maxRequests) {
      return { allowed: false, retryAfter: state.resetAt - now };
    }
    const next = { count: state.count + 1, resetAt: state.resetAt };
    await kv.put(key, JSON.stringify(next), { expiration: state.resetAt });
    return { allowed: true, retryAfter: state.resetAt - now };
  }
  const resetAt = now + windowSeconds;
  await kv.put(key, JSON.stringify({ count: 1, resetAt }), { expiration: resetAt });
  return { allowed: true, retryAfter: windowSeconds };
}

function computeNextRun(
  frequency: Frequency,
  timeOfDay: string,
  timezone: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
) {
  const [hour, minute] = timeOfDay.split(':').map((value) => Number.parseInt(value, 10));
  let base = DateTime.now().setZone(timezone);
  let candidate = base.set({ hour, minute, second: 0, millisecond: 0 });
  if (frequency === 'daily') {
    if (candidate <= base) {
      candidate = candidate.plus({ days: 1 });
    }
    return candidate;
  }
  if (frequency === 'weekly') {
    const targetWeekday = (dayOfWeek ?? base.weekday) as number;
    const diff = (targetWeekday - candidate.weekday + 7) % 7;
    candidate = candidate.plus({ days: diff === 0 && candidate > base ? 0 : diff });
    if (candidate <= base) {
      candidate = candidate.plus({ weeks: 1 });
    }
    return candidate;
  }
  const targetDay = dayOfMonth ?? base.day;
  const daysInMonth = candidate.endOf('month').day;
  candidate = candidate.set({ day: Math.min(targetDay, daysInMonth) });
  if (candidate <= base) {
    const nextMonth = candidate.plus({ months: 1 });
    const nextDaysInMonth = nextMonth.endOf('month').day;
    candidate = nextMonth.set({ day: Math.min(targetDay, nextDaysInMonth) });
  }
  return candidate;
}

async function loadRecallPrompts(env: Env, userId: string, timezone: string) {
  const now = DateTime.now().setZone(timezone);
  const ranges: Array<{ label: string; from: DateTime; to: DateTime }> = [
    {
      label: 'One year ago today',
      from: now.minus({ years: 1 }).startOf('day'),
      to: now.minus({ years: 1 }).endOf('day'),
    },
    {
      label: 'Same day last month',
      from: now.minus({ months: 1 }).startOf('day'),
      to: now.minus({ months: 1 }).endOf('day'),
    },
    {
      label: 'Same weekday last week',
      from: now.minus({ weeks: 1 }).startOf('day'),
      to: now.minus({ weeks: 1 }).endOf('day'),
    },
  ];
  const prompts: Array<{ label: string; entry: EntryRow | null }> = [];
  for (const range of ranges) {
    const entry = await env.DB.prepare(
      'SELECT id, subject, text_content, html_content, created_at FROM entries WHERE user_id = ? AND created_at BETWEEN ? AND ? ORDER BY created_at DESC LIMIT 1',
    )
      .bind(userId, toIsoString(range.from), toIsoString(range.to))
      .first<EntryRow>();
    prompts.push({ label: range.label, entry: entry ?? null });
  }
  return prompts.filter((prompt) => prompt.entry !== null);
}

async function sendReminder(env: Env, reminder: ReminderRow & { email: string }) {
  const timezone = reminder.timezone || 'UTC';
  const prompts = await loadRecallPrompts(env, reminder.user_id, timezone);
  const recallText =
    prompts.length === 0
      ? 'No past entries found for this day yet. Reply to build your archive!'
      : prompts
          .map((prompt) => {
            const dt = DateTime.fromISO(prompt.entry!.created_at).setZone(timezone);
            return `${prompt.label}: ${dt.toLocaleString(DateTime.DATETIME_MED)} - ${prompt.entry!.subject ?? prompt.entry!.text_content?.slice(0, 80) ?? 'Entry'}`;
          })
          .join('\n');
  const replyAddress = `reply+${reminder.user_id}@diary.liuallen.com`;
  const emailBody = `How was your day? Reply to this email with text, photos, or attachments to save a diary entry.\n\nMemory lane:\n${recallText}`;
  const emailHtml = `<p>How was your day? Reply to this email with text, photos, or attachments to save a diary entry.</p><h3>Memory lane</h3><ul>${
    prompts.length === 0
      ? '<li>No past entries found for this day yet. Reply to build your archive!</li>'
      : prompts
          .map((prompt) => {
            const dt = DateTime.fromISO(prompt.entry!.created_at).setZone(timezone);
            const title = prompt.entry!.subject ?? prompt.entry!.text_content?.slice(0, 120) ?? 'Entry';
            return `<li><strong>${prompt.label}</strong> - ${dt.toLocaleString(DateTime.DATETIME_MED)} - ${title}</li>`;
          })
          .join('')
  }</ul>`;
  await sendMail(env, {
    to: reminder.email,
    subject: 'Your MailDiary reminder',
    text: emailBody,
    html: emailHtml,
    replyTo: replyAddress,
  });
}

async function handleDueReminders(env: Env) {
  const now = toIsoString(DateTime.utc());
  const { results } = await env.DB.prepare(
    'SELECT reminders.*, users.email FROM reminders JOIN users ON users.id = reminders.user_id WHERE reminders.paused = 0 AND reminders.next_run_at <= ?',
  )
    .bind(now)
    .all<ReminderRow & { email: string }>();
  for (const reminder of results) {
    await sendReminder(env, reminder);
    const nextRun = computeNextRun(
      reminder.frequency,
      reminder.time_of_day,
      reminder.timezone,
      reminder.day_of_week ?? undefined,
      reminder.day_of_month ?? undefined,
    );
    await env.DB.prepare('UPDATE reminders SET next_run_at = ? WHERE id = ?')
      .bind(toIsoString(nextRun), reminder.id)
      .run();
  }
}

async function handleMyDailySchedules(env: Env) {
  const now = new Date();
  const { results } = await env.DB.prepare(
    'SELECT id, email, timezone, send_time as sendTime, frequency, prompt, send_weekday as sendWeekday, last_sent_at as lastSentAt FROM my_daily_schedules WHERE active = 1',
  ).all<MyDailyScheduleRow & { sendTime: string; sendWeekday: number; lastSentAt: string | null }>();

  for (const row of results) {
    const send = myDailyParseTime(row.sendTime);
    if (!send) continue;

    const localParts = myDailyGetLocalParts(row.timezone, now);
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
      const lastDateKey = myDailyGetLocalDateKey(row.timezone, new Date(row.lastSentAt));
      const todayKey = `${localParts.year}-${localParts.month}-${localParts.day}`;
      if (lastDateKey === todayKey) {
        continue;
      }
    }

    const replyDomain = env.MY_DAILY_REPLY_DOMAIN ?? MY_DAILY_DEFAULT_REPLY_DOMAIN;
    const replyTo = `reply+${row.id}@${replyDomain}`;
    const subject = `My Daily · ${localParts.year}-${localParts.month}-${localParts.day}`;

    try {
      await sendMyDailyReminder(env, {
        email: row.email,
        prompt: row.prompt,
        replyTo,
        subject,
      });
      await env.DB.prepare('UPDATE my_daily_schedules SET last_sent_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), row.id)
        .run();
    } catch (err) {
      console.error('my-daily send failed', row.id, err);
    }
  }
}

type InboundEmailMessage = EmailMessage & {
  to: Array<string | { address?: string; email?: string }> | string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Iterable<any> | AsyncIterable<any>;
};

function getInboundRecipient(message: InboundEmailMessage) {
  const recipients = Array.isArray(message.to) ? message.to : [message.to];
  const firstRecipient = recipients[0] as string | { address?: string; email?: string } | undefined;
  return typeof firstRecipient === 'string' ? firstRecipient : firstRecipient?.address ?? firstRecipient?.email ?? '';
}

async function storeEntryFromEmail(env: Env, message: InboundEmailMessage, userId: string) {
  const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first<{ id: string }>();
  if (!user) {
    console.warn('Unknown user for incoming email');
    return;
  }
  const entryId = uuid();
  const createdAt = toIsoString(DateTime.utc());
  const subject = message.subject ?? null;
  const text = message.text ?? null;
  const html = message.html ?? null;
  await env.DB.prepare(
    'INSERT INTO entries (id, user_id, subject, text_content, html_content, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(entryId, userId, subject, text, html, createdAt)
    .run();

  const attachments = message.attachments ?? [];
  for await (const attachment of attachments as any) {
    const arrayBuffer = await attachment.arrayBuffer();
    const key = `${userId}/${entryId}/${attachment.filename}`;
    await env.R2_BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: attachment.contentType,
        contentDisposition: `inline; filename="${attachment.filename}"`,
      },
    });
    await env.DB.prepare(
      'INSERT INTO entry_assets (id, entry_id, filename, content_type, size, r2_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        uuid(),
        entryId,
        attachment.filename,
        attachment.contentType,
        attachment.size,
        key,
        createdAt,
      )
      .run();
  }
}

async function storeMyDailyEntry(env: Env, message: InboundEmailMessage, scheduleId: string) {
  const entryId = uuid();
  const createdAt = toIsoString(DateTime.utc());
  const subject = message.subject ?? null;
  const body = message.text ?? message.html ?? null;
  const from = (message as any).from ?? '';

  await env.DB.prepare(
    'INSERT INTO my_daily_entries (id, schedule_id, from_email, subject, body, received_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(entryId, scheduleId, from, subject, body, createdAt)
    .run();
}

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleDueReminders(env));
    ctx.waitUntil(handleMyDailySchedules(env));
  },
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext) {
    const inbound = message as InboundEmailMessage;
    const to = getInboundRecipient(inbound).toLowerCase();
    const myDailyMatch = to.match(/reply\+([a-f0-9-]+)@liuallen\.com/);
    if (myDailyMatch) {
      ctx.waitUntil(storeMyDailyEntry(env, inbound, myDailyMatch[1]));
      return;
    }
    const diaryMatch = to.match(/reply\+([a-f0-9-]+)@diary\.liuallen\.com/);
    if (diaryMatch) {
      ctx.waitUntil(storeEntryFromEmail(env, inbound, diaryMatch[1]));
      return;
    }
    console.warn('Unknown inbound email recipient', to);
  },
};
