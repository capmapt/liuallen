import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { fetchSession, requestMagicLink } from '../lib/api';

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSession()
      .then(({ user }) => {
        if (user) {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        // ignore
      });
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await requestMagicLink(email, timezone);
      setStatus('sent');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('Failed to send magic link. Please try again.');
    }
  };

  return (
    <Layout>
      <section className="card">
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Your memories, delivered by email</h1>
        <p style={{ color: '#475569', maxWidth: '560px' }}>
          MailDiary helps you build a private daily journal right from your inbox. Receive reminders, reply with
          thoughts or photos, and rediscover what you wrote last week, last month, or last year.
        </p>
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem', maxWidth: '420px', display: 'grid', gap: '1rem' }}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending…' : 'Email me a magic link'}
          </button>
          {status === 'sent' && <p style={{ color: '#059669' }}>Magic link sent! Check your inbox.</p>}
          {status === 'error' && <p style={{ color: '#dc2626' }}>{error}</p>}
        </form>
      </section>
    </Layout>
  );
}
