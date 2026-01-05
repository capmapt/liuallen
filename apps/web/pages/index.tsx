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

type Language = 'en' | 'zh';
type FormState = 'idle' | 'submitting' | 'success' | 'error';

const topicOptions = [
  { value: 'investing', label: { en: 'Investing', zh: '投资' } },
  { value: 'partnership', label: { en: 'Partnership', zh: '合作' } },
  { value: 'media', label: { en: 'Media', zh: '媒体' } },
  { value: 'events', label: { en: 'Events', zh: '活动' } },
  { value: 'build-studio', label: { en: 'Build Studio', zh: '搭建工作室' } },
  { value: 'other', label: { en: 'Other', zh: '其他' } },
];

const copy = {
  en: {
    nav: {
      about: 'What I do',
      projects: 'Projects',
      writing: 'Writing',
      contact: 'Contact',
      apps: 'Apps',
    },
    hero: {
      title: 'Allen Liu (Min Liu)',
      oneLiner:
        'Building SVTR.ai — a cross-border AI founder & investor network. I invest and incubate AI startups, and run an AI build studio that helps founders ship products fast.',
      primaryCta: 'Book a meeting',
      secondaryCta: 'Email',
      availability: 'Based near Stanford / Palo Alto. Open to: founders, investors, partners.',
      badges: ['AI founders + investors', 'Cross-border network', 'Silicon Valley'],
      cardTitle: 'SVTR.ai ecosystem',
      cardBody:
        'Media, community, events, and a database that connect AI founders, investors, and operators across the U.S. and China.',
      cardCta: 'Explore SVTR.ai',
    },
    whatIDo: {
      kicker: 'What I do',
      title: 'Building the SVTR.ai ecosystem',
      subtitle: 'Three ways I support AI founders and investors.',
      cards: [
        {
          title: 'SVTR.ai Ecosystem',
          description: 'Media + community + events + database bridging US–China AI founders/investors.',
        },
        {
          title: 'Investing & Incubation',
          description: 'Early-stage AI + infrastructure focus; connect capital, customers, and talent.',
        },
        {
          title: 'AI Build Studio',
          description: 'We help non-technical founders build websites/apps fast with high-quality engineering.',
        },
      ],
    },
    projects: {
      kicker: 'Selected projects',
      title: 'Projects & initiatives',
      subtitle: 'Focused on ecosystem building, investing, and founder enablement.',
      cards: [
        {
          title: 'SVTR.ai',
          description: 'Cross-border AI founder & investor network.',
          href: 'https://svtr.ai',
          linkLabel: 'Visit SVTR.ai',
        },
        {
          title: 'AI 创投库',
          description: 'Curated AI founder/investor database.',
          href: '#',
          linkLabel: 'Private beta',
          disabled: true,
        },
        {
          title: 'AI 创投会 / AI 创投营',
          description: 'Founder-first salons and sprints for building and fundraising.',
          href: '#',
          linkLabel: 'Coming soon',
          disabled: true,
        },
        {
          title: 'PK Capital',
          description: 'Operator support for AI investment and expansion.',
          href: '#',
          linkLabel: 'Placeholder',
          disabled: true,
        },
        {
          title: 'Apps',
          description: 'My product experiments and app store.',
          href: '/apps',
          linkLabel: 'Open /apps',
        },
      ],
    },
    writing: {
      kicker: 'Latest writing',
      title: 'Notes from the field',
      subtitle: 'Research, community insights, and founder notes.',
      items: [
        {
          title: 'Building founder density across borders',
          href: '/writing',
          meta: 'Placeholder',
        },
        {
          title: 'What AI infra teams need to ship faster',
          href: '/writing',
          meta: 'Placeholder',
        },
        {
          title: 'Operator playbooks for early-stage AI',
          href: '/writing',
          meta: 'Placeholder',
        },
      ],
    },
    contact: {
      kicker: 'Contact',
      title: "Let's build together",
      subtitle: 'Book a call, send an email, or share the details below.',
      note:
        'I respond fastest with context: who you are, what you are building, and how I can help.',
      emailLabel: 'Email: liumin.gsm@gmail.com',
      form: {
        name: 'Name',
        email: 'Email',
        topic: 'Topic',
        message: 'Message',
        submit: 'Send message',
        sending: 'Sending…',
        success: 'Message sent!',
      },
    },
  },
  zh: {
    nav: {
      about: '我在做什么',
      projects: '项目',
      writing: '写作',
      contact: '联系',
      apps: '应用',
    },
    hero: {
      title: 'Allen Liu (Min Liu)',
      oneLiner:
        '打造 SVTR.ai——连接中美 AI 创业者与投资人的跨境网络。我投资并孵化 AI 初创公司，也运营 AI 搭建工作室，帮助创始人快速落地产品。',
      primaryCta: '预约会议',
      secondaryCta: '发送邮件',
      availability: '常驻斯坦福 / 帕洛阿尔托附近。开放合作：创业者、投资人、合作伙伴。',
      badges: ['AI 创业者 + 投资人', '跨境生态', '硅谷'],
      cardTitle: 'SVTR.ai 生态',
      cardBody: '媒体、社区、活动与数据库，连接中美 AI 创业者、投资人和运营者。',
      cardCta: '了解 SVTR.ai',
    },
    whatIDo: {
      kicker: '我在做什么',
      title: '建设 SVTR.ai 生态',
      subtitle: '支持 AI 创业者与投资人的三种方式。',
      cards: [
        {
          title: 'SVTR.ai 生态',
          description: '媒体 + 社区 + 活动 + 数据库，连接中美 AI 创业者/投资人。',
        },
        {
          title: '投资与孵化',
          description: '聚焦早期 AI 与基础设施，连接资本、客户与人才。',
        },
        {
          title: 'AI 搭建工作室',
          description: '帮助非技术创始人快速搭建网站/应用，工程质量可靠。',
        },
      ],
    },
    projects: {
      kicker: '精选项目',
      title: '项目与计划',
      subtitle: '围绕生态建设、投资与创始人赋能。',
      cards: [
        {
          title: 'SVTR.ai',
          description: '跨境 AI 创业者与投资人网络。',
          href: 'https://svtr.ai',
          linkLabel: '访问 SVTR.ai',
        },
        {
          title: 'AI 创投库',
          description: '精选 AI 创业者/投资人数据库。',
          href: '#',
          linkLabel: '内测中',
          disabled: true,
        },
        {
          title: 'AI 创投会 / AI 创投营',
          description: '面向创始人的沙龙与加速营。',
          href: '#',
          linkLabel: '即将发布',
          disabled: true,
        },
        {
          title: 'PK Capital',
          description: 'AI 投资与扩张的运营支持。',
          href: '#',
          linkLabel: '占位中',
          disabled: true,
        },
        {
          title: '应用商店',
          description: '我的产品实验与应用商店。',
          href: '/apps',
          linkLabel: '打开 /apps',
        },
      ],
    },
    writing: {
      kicker: '最新写作',
      title: '一线笔记',
      subtitle: '研究、社区洞察与创始人笔记。',
      items: [
        {
          title: '跨境生态的创始人密度',
          href: '/writing',
          meta: '占位',
        },
        {
          title: 'AI 基础设施团队如何更快交付',
          href: '/writing',
          meta: '占位',
        },
        {
          title: '早期 AI 的运营方法论',
          href: '/writing',
          meta: '占位',
        },
      ],
    },
    contact: {
      kicker: '联系',
      title: '一起共建',
      subtitle: '预约电话、发送邮件，或填写表单。',
      note: '我会优先回复信息完整的联系：你是谁、在做什么、需要我怎么支持。',
      emailLabel: '邮箱：liumin.gsm@gmail.com',
      form: {
        name: '姓名',
        email: '邮箱',
        topic: '主题',
        message: '内容',
        submit: '发送',
        sending: '发送中…',
        success: '已发送！',
      },
    },
  },
};

export default function HomePage() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
  const [language, setLanguage] = useState<Language>('en');
  const [formState, setFormState] = useState<FormState>('idle');
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    topic: topicOptions[0].value,
    message: '',
  });
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const t = copy[language];

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

    const selectedTopic = topicOptions.find((topic) => topic.value === formValues.topic);
    const topicLabel = selectedTopic?.label[language] ?? selectedTopic?.label.en ?? formValues.topic;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ...formValues, topic: topicLabel, turnstileToken }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.ok !== true) {
        const message = payload?.error ?? 'Something went wrong. Please retry.';
        setFormState('error');
        setError(message);
        return;
      }

      setFormState('success');
      setFormValues({ name: '', email: '', topic: topicOptions[0].value, message: '' });
      setTurnstileToken('');
    } catch (err) {
      console.error(err);
      setFormState('error');
      setError('Unable to submit right now. Please try again.');
    }
  };

  const heroDescription = useMemo(() => t.hero.oneLiner, [t.hero.oneLiner]);

  return (
    <div className={styles.page}>
      <Head>
        <title>Allen Liu (Min Liu) — SVTR.ai founder</title>
        <meta
          name="description"
          content="Allen Liu (Min Liu): building SVTR.ai, investing in AI startups, and operating a Silicon Valley build studio."
        />
        <meta property="og:title" content="Allen Liu (Min Liu) — SVTR.ai founder" />
        <meta
          property="og:description"
          content="Building SVTR.ai, investing in AI startups, and operating an AI build studio for founders."
        />
        <meta property="og:url" content="https://liuallen.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Allen Liu (Min Liu)" />
        <meta
          name="twitter:description"
          content="SVTR.ai founder, AI investor, and operator for fast-moving founder teams."
        />
        <link rel="canonical" href="https://liuallen.com" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <div className={styles.shell}>
        <header className={styles.navbar}>
          <div className={styles.brand}>
            <span className={styles.brandDot} aria-hidden />
            <div>
              <span>{t.hero.title}</span>
              <span className={styles.brandMeta}>SVTR.ai founder · AI investor</span>
            </div>
          </div>
          <div className={styles.navRight}>
            <nav className={styles.navLinks} aria-label="Primary navigation">
              <a href="#what-i-do">{t.nav.about}</a>
              <a href="#projects">{t.nav.projects}</a>
              <a href="#writing">{t.nav.writing}</a>
              <a href="#contact">{t.nav.contact}</a>
              <a href="/apps">{t.nav.apps}</a>
            </nav>
            <div className={styles.langToggle} role="group" aria-label="Language toggle">
              <button
                className={`${styles.langButton} ${language === 'en' ? styles.langButtonActive : ''}`}
                type="button"
                aria-pressed={language === 'en'}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                className={`${styles.langButton} ${language === 'zh' ? styles.langButtonActive : ''}`}
                type="button"
                aria-pressed={language === 'zh'}
                onClick={() => setLanguage('zh')}
              >
                中文
              </button>
            </div>
          </div>
        </header>

        <section className={styles.hero}>
          <div>
            <div className={styles.badges}>
              {t.hero.badges.map((badge) => (
                <span key={badge} className={styles.badge}>
                  {badge}
                </span>
              ))}
            </div>
            <h1>{t.hero.title}</h1>
            <p className={styles.heroSubtitle}>{heroDescription}</p>
            <div className={styles.ctaRow}>
              <a
                className={styles.primaryBtn}
                href="https://calendly.com/liumin-gsm-sdu/1-on-1"
                target="_blank"
                rel="noreferrer"
              >
                {t.hero.primaryCta}
              </a>
              <a className={styles.secondaryBtn} href="mailto:liumin.gsm@gmail.com">
                {t.hero.secondaryCta}
              </a>
            </div>
            <p className={styles.heroNote}>{t.hero.availability}</p>
          </div>
          <div className={styles.heroCard}>
            <small>SVTR.ai</small>
            <h3>{t.hero.cardTitle}</h3>
            <p>{t.hero.cardBody}</p>
            <a className={styles.secondaryBtn} href="https://svtr.ai" target="_blank" rel="noreferrer">
              {t.hero.cardCta}
            </a>
          </div>
        </section>

        <section id="what-i-do" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>{t.whatIDo.kicker}</p>
              <h2 className={styles.sectionTitle}>{t.whatIDo.title}</h2>
              <p className={styles.sectionSubtitle}>{t.whatIDo.subtitle}</p>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {t.whatIDo.cards.map((role) => (
              <article key={role.title} className={styles.card}>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="projects" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>{t.projects.kicker}</p>
              <h2 className={styles.sectionTitle}>{t.projects.title}</h2>
              <p className={styles.sectionSubtitle}>{t.projects.subtitle}</p>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {t.projects.cards.map((project) => (
              <article key={project.title} className={styles.card}>
                <div className={styles.cardTitleRow}>
                  <h3>{project.title}</h3>
                </div>
                <p>{project.description}</p>
                {project.href ? (
                  project.disabled ? (
                    <span className={styles.cardNote}>{project.linkLabel}</span>
                  ) : (
                    <a href={project.href} className={styles.cardLink} target={project.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      {project.linkLabel}
                    </a>
                  )
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section id="writing" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>{t.writing.kicker}</p>
              <h2 className={styles.sectionTitle}>{t.writing.title}</h2>
              <p className={styles.sectionSubtitle}>{t.writing.subtitle}</p>
            </div>
          </div>
          <div className={styles.list}>
            {t.writing.items.map((item) => (
              <a key={item.title} className={styles.listItem} href={item.href}>
                <div>
                  <h3 className={styles.listTitle}>{item.title}</h3>
                  <span className={styles.listMeta}>{item.meta}</span>
                </div>
                <span className={styles.listArrow} aria-hidden>
                  ↗
                </span>
              </a>
            ))}
          </div>
        </section>

        <section id="contact" className={styles.section}>
          <div className={styles.contactGrid}>
            <div className={styles.contactDetails}>
              <p className={styles.subtle}>{t.contact.kicker}</p>
              <h2 className={styles.sectionTitle}>{t.contact.title}</h2>
              <p className={styles.sectionSubtitle}>{t.contact.subtitle}</p>
              <div className={styles.inlineActions}>
                <a
                  className={styles.primaryBtn}
                  href="https://calendly.com/liumin-gsm-sdu/1-on-1"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.hero.primaryCta}
                </a>
                <a className={styles.secondaryBtn} href="mailto:liumin.gsm@gmail.com">
                  {t.hero.secondaryCta}
                </a>
              </div>
              <div className={styles.contactNotes}>
                <p className={styles.subtle}>{t.contact.note}</p>
                <p className={styles.subtle}>{t.contact.emailLabel}</p>
              </div>
            </div>
            <form className={styles.contactForm} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="name">{t.contact.form.name}</label>
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
                <label htmlFor="email">{t.contact.form.email}</label>
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
                <label htmlFor="topic">{t.contact.form.topic}</label>
                <select
                  id="topic"
                  name="topic"
                  value={formValues.topic}
                  required
                  onChange={(e) => setFormValues({ ...formValues, topic: e.target.value })}
                >
                  {topicOptions.map((topic) => (
                    <option key={topic.value} value={topic.value}>
                      {topic.label[language]}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="message">{t.contact.form.message}</label>
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
                  {formState === 'submitting' ? t.contact.form.sending : t.contact.form.submit}
                </button>
                {formState === 'success' && (
                  <p className={`${styles.status} ${styles.success}`} aria-live="polite">
                    {t.contact.form.success}
                  </p>
                )}
                {formState === 'error' && (
                  <p className={`${styles.status} ${styles.error}`} aria-live="polite">
                    {error}
                  </p>
                )}
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
