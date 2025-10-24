import { useState } from 'react';
import { Layout } from '../components/Layout';
import { exportEntries } from '../lib/api';

export default function ExportPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleExport = async () => {
    setStatus('loading');
    try {
      const data = await exportEntries();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <Layout>
      <section className="card">
        <h1 style={{ marginTop: 0 }}>Export your journal</h1>
        <p style={{ color: '#475569' }}>
          Generate a JSON export of all your entries and attachment metadata. Attachments are stored in R2 and accessible
          via signed URLs in the export payload.
        </p>
        <button onClick={handleExport} disabled={status === 'loading'}>
          {status === 'loading' ? 'Preparing export…' : 'Export as JSON'}
        </button>
        {status === 'ready' && downloadUrl && (
          <p>
            <a href={downloadUrl} download={`maildiary-export-${Date.now()}.json`}>
              Download export file
            </a>
          </p>
        )}
        {status === 'error' && <p style={{ color: '#dc2626' }}>Failed to generate export.</p>}
      </section>
    </Layout>
  );
}
