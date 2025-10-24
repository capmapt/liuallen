import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { User } from '../lib/api';
import { fetchSession, logout } from '../lib/api';

export function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession()
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router.pathname]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.push('/');
  };

  return (
    <div>
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <nav
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem 2rem',
          }}
        >
          <Link href="/">
            <span style={{ fontWeight: 700, fontSize: '1.3rem' }}>MailDiary</span>
          </Link>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.95rem', color: '#475569' }}>{user.email}</span>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/reminders">Reminders</Link>
              <button style={{ background: '#1e293b' }} onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : loading ? (
            <span>Loading...</span>
          ) : (
            <Link href="/">Sign in</Link>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
