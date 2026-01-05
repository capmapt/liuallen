import Head from 'next/head';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import styles from '../styles/Home.module.css';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const currentRoles = [
  {
    title: 'SVTR (svtr.ai)',
    description: 'Founder of SVTR.ai — building a cross-border AI founder and investor network.',
    href: 'https://svtr.ai',
  },
  {
    title: 'PK Capital',
    description: 'Partnering with PK Capital on AI investments and market expansion.',
    href: 'https://pk.capital',
  },
  {
    title: 'AI Coding Studio',
    description: 'Hands-on build studio helping founders ship AI products and web apps quickly.',
    href: '#contact',
  },
];

const products = [
  {
    title: 'SVTR AI 创投库',
    description: 'A curated database for AI founders and investors (private beta).',
  },
  {
    title: 'AI 创投会 / 创投营',
    description: 'Founder-first salons and sprints for building and fundraising.',
  },
  {
    title: 'Founder market labs',
    description: 'Rapid go-to-market experiments with cross-border distribution.',
  },
  {
    title: 'Operator circles',
    description: 'Peer groups for AI infra builders, PMs, and growth leaders.',
  },
];

const writingLinks = [
  { label: 'Substack (coming soon)', href: 'https://substack.com/@liuallen' },
  { label: 'LinkedIn updates', href: 'https://www.linkedin.com/in/liuallen/' },
];

export default function HomePage() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
  const [formState, setFormState] = useState<FormState>('idle');
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [formValues, setFormValues] = useState({ name: '', email: '', message: '' });
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    const existing = document.querySelector('script[data-turnstile]');
    if (existing) {
      setTurnstileReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.onload = () => setTurnstileReady(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileReady || !turnstileContainerRef.current) return;
    const widgetId = window.turnstile?.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token: string) => setTurnstileToken(token),
    });
    return () => {
      if (widgetId && window.turnstile?.remove) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [turnstileReady, turnstileSiteKey]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('submitting');
    setError('');

    if (turnstileSiteKey && !turnstileToken) {
      setFormState('error');
      setError('Please complete the verification.');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ...formValues, turnstileToken }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.ok !== true) {
        const message = payload?.error ?? 'Something went wrong. Please retry.';
        setFormState('error');
        setError(message);
        return;
      }

      setFormState('success');
      setFormValues({ name: '', email: '', message: '' });
      setTurnstileToken('');
    } catch (err) {
      console.error(err);
      setFormState('error');
      setError('Unable to submit right now. Please try again.');
    }
  };

  const heroDescription = useMemo(
    () =>
      'AI/VC ecosystem builder, SVTR founder, and hands-on partner for AI infrastructure and venture teams.',
    [],
  );

  return (
    <div className={styles.page}>
      <Head>
        <title>Allen Liu (Min Liu) — AI/VC ecosystem builder</title>
        <meta
          name="description"
          content="Allen Liu (Min Liu): SVTR founder, AI/VC ecosystem builder, and AI infrastructure + venture operator."
        />
        <meta property="og:title" content="Allen Liu (Min Liu) — AI/VC ecosystem builder" />
        <meta
          property="og:description"
          content="SVTR founder building AI communities, products, and venture platforms across Silicon Valley and Asia."
        />
        <meta property="og:url" content="https://liuallen.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Allen Liu (Min Liu)" />
        <meta
          name="twitter:description"
          content="AI/VC ecosystem builder, SVTR founder, and AI infrastructure + venture partner."
        />
        <link rel="canonical" href="https://liuallen.com" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <div className={styles.shell}>
        <header className={styles.navbar}>
          <div className={styles.brand}>
            <span className={styles.brandDot} aria-hidden />
            <div>
              <span>Allen Liu (Min Liu)</span>
              <span className={styles.brandMeta}>AI/VC ecosystem • SVTR founder</span>
            </div>
          </div>
          <nav className={styles.navLinks} aria-label="Primary navigation">
            <a href="#current">Current</a>
            <a href="#products">Projects</a>
            <a href="#writing">Writing</a>
            <a href="#contact">Contact</a>
          </nav>
        </header>

        <section className={styles.hero}>
          <div>
            <div className={styles.badges}>
              <span className={styles.badge}>AI infrastructure & venture</span>
              <span className={styles.badge}>Based in Silicon Valley</span>
            </div>
            <h1>Allen Liu (Min Liu)</h1>
            <p className={styles.heroSubtitle}>{heroDescription}</p>
            <div className={styles.ctaRow}>
              <a className={styles.primaryBtn} href="#contact">
                Contact Allen
              </a>
              <a className={styles.secondaryBtn} href="https://cal.com/liuallen/intro" target="_blank" rel="noreferrer">
                Book a call
              </a>
            </div>
            <p className={styles.subtle}>AI/VC ecosystem builder • Founder of SVTR • Operator for AI infrastructure teams</p>
          </div>
          <div className={styles.heroCard}>
            <small>Now</small>
            <h3>SVTR founder & community builder</h3>
            <p>
              SVTR bridges AI founders, investors, and operators across the U.S. and Asia with media, research, and curated
              programs.
            </p>
            <a className={styles.secondaryBtn} href="https://svtr.ai" target="_blank" rel="noreferrer">
              Explore SVTR.ai
            </a>
          </div>
        </section>

        <section id="current" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>Current</p>
              <h2 className={styles.sectionTitle}>What I&apos;m building</h2>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {currentRoles.map((role) => (
              <article key={role.title} className={styles.card}>
                <div className={styles.cardTitleRow}>
                  <h3>{role.title}</h3>
                  <span aria-hidden>↗</span>
                </div>
                <p>{role.description}</p>
                <a href={role.href} target={role.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  Learn more
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="products" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>Projects / Products</p>
              <h2 className={styles.sectionTitle}>Building with founders</h2>
              <p className={styles.sectionSubtitle}>SVTR AI 创投库、AI 创投会 / 创投营，以及精选产品与计划。</p>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {products.map((project) => (
              <article key={project.title} className={styles.card}>
                <div className={styles.cardTitleRow}>
                  <h3>{project.title}</h3>
                  <span aria-hidden>•</span>
                </div>
                <p>{project.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="writing" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>Writing / Speaking</p>
              <h2 className={styles.sectionTitle}>Sharing notes</h2>
              <p className={styles.sectionSubtitle}>Long-form posts and updates on AI infrastructure, venture, and community.</p>
            </div>
          </div>
          <div className={styles.list}>
            {writingLinks.map((item) => (
              <div key={item.label} className={styles.listItem}>
                <span>{item.label}</span>
                <a href={item.href} target="_blank" rel="noreferrer">
                  Follow ↗
                </a>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>Contact</p>
              <h2 className={styles.sectionTitle}>Let&apos;s collaborate</h2>
              <p className={styles.sectionSubtitle}>
                Reach out for AI investments, SVTR partnerships, build studio help, or speaking requests.
              </p>
              <div className={styles.inlineActions}>
                <a className={styles.primaryBtn} href="mailto:contact@liuallen.com">
                  Email Allen
                </a>
                <a className={styles.secondaryBtn} href="https://cal.com/liuallen/intro" target="_blank" rel="noreferrer">
                  Book a call
                </a>
              </div>
            </div>
          </div>

          <div className={styles.contactLayout}>
            <div>
              <p className={styles.subtle}>
                I reply fastest with context. Share what you&apos;re building, what you need, and how SVTR or the AI Coding Studio can
                help.
              </p>
              <p className={styles.subtle}>All inquiries go directly to me.</p>
            </div>
            <form className={styles.contactForm} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={formValues.name}
                  required
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formValues.email}
                  required
                  onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  value={formValues.message}
                  onChange={(e) => setFormValues({ ...formValues, message: e.target.value })}
                />
              </div>
              {turnstileSiteKey ? <div className={styles.turnstileBox} ref={turnstileContainerRef} /> : null}
              <div className={styles.inlineActions}>
                <button className={styles.primaryBtn} type="submit" disabled={formState === 'submitting'}>
                  {formState === 'submitting' ? 'Sending…' : 'Send message'}
                </button>
                {formState === 'success' && <p className={`${styles.status} ${styles.success}`}>Message sent!</p>}
                {formState === 'error' && <p className={`${styles.status} ${styles.error}`}>{error}</p>}
              </div>
            </form>
          </div>
        </section>

        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Allen Liu (Min Liu)</span>
          <span>liuallen.com · SVTR.ai</span>
        </footer>
      </div>
    </div>
  );
}
