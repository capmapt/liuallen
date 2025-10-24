import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import type { Entry } from '../lib/api';
import { assetUrl, fetchEntries } from '../lib/api';

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchEntries(search)
      .then((data) => {
        setEntries(data.entries);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load entries.');
        setLoading(false);
      });
  }, [search]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSearch((formData.get('query') as string) ?? '');
  };

  const content = useMemo(() => {
    if (loading) {
      return <p>Loading your diary…</p>;
    }
    if (entries.length === 0) {
      return (
        <p>
          No entries yet. Reply to a reminder email to create your first diary entry, or manage reminders{' '}
          <Link href="/reminders">here</Link>.
        </p>
      );
    }
    return entries.map((entry) => {
      const created = new Date(entry.created_at).toLocaleString();
      return (
        <article key={entry.id} className="card">
          <header className="flex-between" style={{ marginBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>{entry.subject ?? 'Untitled entry'}</h2>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{created}</span>
            </div>
          </header>
          {entry.text_content && <p style={{ whiteSpace: 'pre-wrap' }}>{entry.text_content}</p>}
          {entry.attachments.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Attachments</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {entry.attachments.map((attachment) => (
                  <div key={attachment.id} style={{ width: '200px' }}>
                    {attachment.content_type.startsWith('image/') ? (
                      <img
                        src={assetUrl(entry.id, attachment.id)}
                        alt={attachment.filename}
                        style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    ) : (
                      <a href={assetUrl(entry.id, attachment.id)} target="_blank" rel="noreferrer">
                        {attachment.filename}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      );
    });
  }, [entries, loading]);

  return (
    <Layout>
      <section>
        <div className="card">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input name="query" placeholder="Search entries" style={{ flex: 1 }} />
            <button type="submit">Search</button>
          </form>
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        </div>
        {content}
      </section>
    </Layout>
  );
}
