import Head from 'next/head';

export default function ContactPage() {
  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 20px' }}>
      <Head>
        <title>Contact - Allen Liu</title>
        <meta name="description" content="Contact Allen Liu for investing, partnerships, media, or build studio." />
      </Head>
      <h1 style={{ marginBottom: '0.5rem' }}>Contact</h1>
      <p style={{ marginTop: 0, color: '#4b5563' }}>
        For the fastest response, use the <a href="/#contact">homepage contact form</a>. You can also reach me directly at{' '}
        <a href="mailto:allen@liuallen.com">allen@liuallen.com</a> or schedule a call.
      </p>
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <a
          href="https://cal.com/PLACEHOLDER"
          style={{
            background: 'linear-gradient(135deg, #f97316, #f59e0b)',
            color: '#0b0f1a',
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
            border: '1px solid #e6e2dc',
            color: '#0b0f1a',
            padding: '12px 16px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            background: '#fff',
          }}
        >
          Email
        </a>
      </div>
      <p style={{ marginTop: '2rem', color: '#4b5563' }}>
        Looking for projects? Visit the <a href="/apps">app store</a> or browse the <a href="/writing">writing page</a>.
      </p>
    </main>
  );
}
