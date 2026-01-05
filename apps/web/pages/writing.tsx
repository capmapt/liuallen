import Head from 'next/head';

export default function WritingPage() {
  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 20px' }}>
      <Head>
        <title>Writing - Allen Liu</title>
        <meta name="description" content="Writing and notes by Allen Liu." />
      </Head>
      <h1 style={{ marginBottom: '0.5rem' }}>Writing</h1>
      <p style={{ marginTop: 0, color: '#4b5563' }}>
        Longer essays and field notes will live here. For now, explore featured updates on the homepage.
      </p>
      <ul style={{ marginTop: '1.5rem', lineHeight: 1.6, paddingLeft: '1.2rem' }}>
        <li>
          Visit <a href="/">the homepage</a> for highlights and contact.
        </li>
        <li>
          Explore <a href="/apps">the app store</a> for product experiments.
        </li>
        <li>
          Email <a href="mailto:liumin.gsm@gmail.com">liumin.gsm@gmail.com</a> if you want drafts.
        </li>
      </ul>
    </main>
  );
}
