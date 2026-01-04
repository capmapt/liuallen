import Head from 'next/head';

export default function WritingPage() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px' }}>
      <Head>
        <title>Writing — Allen Liu</title>
        <meta name="description" content="Writing and notes by Allen Liu." />
      </Head>
      <h1 style={{ marginBottom: '0.5rem' }}>Writing</h1>
      <p style={{ marginTop: 0, color: '#475569' }}>
        Long-form essays and notes will live here soon. For now, browse highlights on the homepage or reach out directly.
      </p>
      <ul style={{ marginTop: '1.5rem', lineHeight: 1.6 }}>
        <li>
          Visit <a href="/">the homepage</a> for the latest featured posts.
        </li>
        <li>
          Check out <a href="/apps">the apps page</a> for product experiments.
        </li>
        <li>
          Email <a href="mailto:allen@liuallen.com">allen@liuallen.com</a> if you want early drafts.
        </li>
      </ul>
    </main>
  );
}
