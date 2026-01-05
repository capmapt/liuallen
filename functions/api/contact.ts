/// <reference types="@cloudflare/workers-types" />
interface Env {
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITEKEY?: string;
}

type RateEntry = { count: number; resetAt: number };
const rateCache = new Map<string, RateEntry>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getClientIp(request: Request) {
  const headers = request.headers;
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

function touchRate(ip: string) {
  const now = Date.now();
  const entry = rateCache.get(ip);
  if (!entry || now > entry.resetAt) {
    rateCache.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: RATE_WINDOW_MS / 1000 };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.max(1, Math.round((entry.resetAt - now) / 1000)) };
  }
  entry.count += 1;
  return { allowed: true, retryAfter: Math.max(1, Math.round((entry.resetAt - now) / 1000)) };
}

async function verifyTurnstile(token: string, secret: string, remoteip: string) {
  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteip !== 'unknown') {
    body.set('remoteip', remoteip);
  }
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.success);
}

async function sendMail(env: Env, payload: { name: string; email: string; message: string; referer?: string }) {
  if (!env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    throw new Error('Missing CONTACT_TO_EMAIL or CONTACT_FROM_EMAIL');
  }
  const subject = `New message from liuallen.com: ${payload.name}`;
  const safeLines = payload.message
    .split('\n')
    .map((line) => escapeHtml(line.trim()))
    .filter(Boolean)
    .map((line) => `<div>${line}</div>`)
    .join('');

  const mailPayload = {
    personalizations: [
      {
        to: [{ email: env.CONTACT_TO_EMAIL }],
      },
    ],
    from: {
      email: env.CONTACT_FROM_EMAIL,
      name: 'liuallen.com',
    },
    reply_to: {
      email: payload.email,
      name: payload.name,
    },
    subject,
    content: [
      {
        type: 'text/plain',
        value: `Name: ${payload.name}\nEmail: ${payload.email}\nFrom: ${payload.referer ?? 'unknown'}\n\n${payload.message}`,
      },
      {
        type: 'text/html',
        value: `<p><strong>Name:</strong> ${escapeHtml(payload.name)}</p><p><strong>Email:</strong> ${escapeHtml(payload.email)}</p><p><strong>From:</strong> ${escapeHtml(payload.referer ?? 'unknown')}</p><p>${safeLines}</p>`,
      },
    ],
  };

  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(mailPayload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Mail send failed: ${res.status} ${errorText}`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const ip = getClientIp(request);

  let body: { name?: string; email?: string; message?: string; turnstileToken?: string };
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const message = body.message?.trim();
  const token = body.turnstileToken?.trim();

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ ok: false, error: 'Name, email, and message are required.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ ok: false, error: 'Enter a valid email address.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (message.length > 4000) {
    return new Response(JSON.stringify({ ok: false, error: 'Message is too long.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (env.TURNSTILE_SECRET) {
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'Verification required.' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    const valid = await verifyTurnstile(token, env.TURNSTILE_SECRET, ip);
    if (!valid) {
      return new Response(JSON.stringify({ ok: false, error: 'Unable to verify. Please retry.' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
  } else {
    const rate = touchRate(ip);
    if (!rate.allowed) {
      return new Response(JSON.stringify({ ok: false, error: 'Too many requests. Please try later.' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': rate.retryAfter.toString() },
      });
    }
  }

  try {
    await sendMail(env, { name, email, message, referer: request.headers.get('referer') ?? undefined });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('contact form send failed', err);
    return new Response(JSON.stringify({ ok: false, error: 'Unable to deliver message. Please email instead.' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  const origin = request.headers.get('origin');
  const headers = new Headers({
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  });
  if (origin) {
    headers.set('access-control-allow-origin', origin);
  }
  return new Response(null, { status: 204, headers });
};
