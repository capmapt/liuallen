import Head from 'next/head';

export default function ContactPage() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px' }}>
      <Head>
        <title>Contact — Allen Liu</title>
        <meta name="description" content="Contact Allen Liu for investing, partnerships, media, or build studio." />
      </Head>
      <h1 style={{ marginBottom: '0.5rem' }}>Contact</h1>
      <p style={{ marginTop: 0, color: '#475569' }}>
        Prefer forms? Visit the <a href="/#contact">contact section on the homepage</a> to send a note. Otherwise, reach me
        directly at <a href="mailto:allen@liuallen.com">allen@liuallen.com</a> or schedule a call below.
      </p>
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <a
          href="https://cal.com/PLACEHOLDER"
          style={{
            background: '#7c3aed',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Book a call
        </a>
        <a
          href="mailto:allen@liuallen.com"
          style={{
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            padding: '12px 16px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Email
        </a>
      </div>
    </main>
  );
}
