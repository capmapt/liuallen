import Head from 'next/head';
import { useMemo, useState, type FormEvent } from 'react';
import styles from '../styles/Home.module.css';
import { submitContactMessage, type ContactTopic } from '../lib/api';

type Language = 'en' | 'zh';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

type Content = {
  heroTitle: string;
  heroSubtitle: string;
  heroSubline: string;
  whatIDoTitle: string;
  whatIDoCards: Array<{ title: string; description: string }>;
  projectsTitle: string;
  projects: Array<{ name: string; description: string; href: string; external?: boolean }>; 
  writingTitle: string;
  writingSubtitle: string;
  writingItems: Array<{ title: string; href: string }>; 
  contactTitle: string;
  contactSubtitle: string;
  contactEmailLabel: string;
  contactButtonLabel: string;
  contactSuccess: string;
  contactError: string;
  nameLabel: string;
  emailLabel: string;
  topicLabel: string;
  messageLabel: string;
  submitLabel: string;
  bookCall: string;
  email: string;
  languageToggle: string;
};

const content: Record<Language, Content> = {
  en: {
    heroTitle: 'Allen Liu (Min Liu)',
    heroSubtitle:
      'Building SVTR.ai — a cross-border AI founder & investor network. I invest and incubate AI startups, and run an AI build studio that helps founders ship products fast.',
    heroSubline: 'Based near Stanford / Palo Alto. Open to: founders, investors, partners.',
    whatIDoTitle: 'What I do',
    whatIDoCards: [
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
    projectsTitle: 'Selected projects',
    projects: [
      { name: 'SVTR.ai', description: 'Cross-border AI founder & investor network.', href: 'https://svtr.ai', external: true },
      { name: 'AI创投库', description: 'Database for AI founders & investors (placeholder link).', href: '#', external: true },
      { name: 'AI创投会 / AI创投营', description: 'Programs + events for AI founders (placeholder link).', href: '#', external: true },
      { name: 'PK Capital', description: 'Investor collaboration (placeholder).', href: '#', external: true },
      { name: 'Apps', description: 'My product experiments and utilities.', href: '/apps' },
    ],
    writingTitle: 'Latest writing',
    writingSubtitle: 'Long-form notes on building cross-border AI companies and ecosystems.',
    writingItems: [
      { title: 'Why cross-border AI ecosystems matter in 2025', href: '#' },
      { title: 'From idea to launch: a 2-week playbook for AI founders', href: '#' },
      { title: 'Bridge-building between Silicon Valley and Asia for AI infrastructure', href: '#' },
    ],
    contactTitle: 'Contact',
    contactSubtitle: 'Reach out for investing, partnerships, media, events, or build studio collaborations.',
    contactEmailLabel: 'Email',
    contactButtonLabel: 'Send message',
    contactSuccess: 'Thanks! I will get back to you shortly.',
    contactError: 'Something went wrong. Please try again or email me directly.',
    nameLabel: 'Name',
    emailLabel: 'Email',
    topicLabel: 'Topic',
    messageLabel: 'Message',
    submitLabel: 'Send',
    bookCall: 'Book a call',
    email: 'Email',
    languageToggle: '中文',
  },
  zh: {
    heroTitle: '刘旻 Allen (Min Liu)',
    heroSubtitle: '正在打造 SVTR.ai —— 连接美中 AI 创业者与投资人的生态。投资、孵化 AI 初创企业，并运营一个帮助创始人快速上线产品的 AI 工程工作室。',
    heroSubline: '常驻斯坦福 / Palo Alto 附近。欢迎：创业者、投资人、合作伙伴。',
    whatIDoTitle: '我在做什么',
    whatIDoCards: [
      {
        title: 'SVTR.ai 生态',
        description: '媒体 + 社群 + 活动 + 数据库，连接美中 AI 创业者与投资人。',
      },
      {
        title: '投资与孵化',
        description: '专注早期 AI 与基础设施，链接资本、客户与人才。',
      },
      {
        title: 'AI Build Studio',
        description: '为非技术创始人快速搭建高质量网站/应用，帮助高效迭代。',
      },
    ],
    projectsTitle: '精选项目',
    projects: [
      { name: 'SVTR.ai', description: '跨境 AI 创业者与投资人网络。', href: 'https://svtr.ai', external: true },
      { name: 'AI创投库', description: 'AI 创业者 & 投资人数据库（占位链接）。', href: '#', external: true },
      { name: 'AI创投会 / AI创投营', description: 'AI 创业者项目与活动（占位链接）。', href: '#', external: true },
      { name: 'PK Capital', description: '投资合作（占位）。', href: '#', external: true },
      { name: 'Apps', description: '个人产品实验与工具合集。', href: '/apps' },
    ],
    writingTitle: '最新文章',
    writingSubtitle: '关于跨境 AI 创业与生态建设的思考与实践。',
    writingItems: [
      { title: '2025：为什么跨境 AI 生态更重要', href: '#' },
      { title: '从想法到上线：AI 创业者 2 周实战手册', href: '#' },
      { title: 'Silicon Valley 与亚洲 AI 基建的桥梁之路', href: '#' },
    ],
    contactTitle: '联系我',
    contactSubtitle: '欢迎就投资、合作、媒体、活动或 Build Studio 合作联系。',
    contactEmailLabel: '邮箱',
    contactButtonLabel: '发送信息',
    contactSuccess: '已收到！我会尽快回复。',
    contactError: '发送出错，请重试或直接邮件联系。',
    nameLabel: '姓名',
    emailLabel: '邮箱',
    topicLabel: '话题',
    messageLabel: '留言',
    submitLabel: '发送',
    bookCall: '预约通话',
    email: '邮件',
    languageToggle: 'EN',
  },
};

const topics: ContactTopic[] = ['Investing', 'Partnership', 'Media', 'Events', 'Build Studio', 'Other'];

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('en');
  const [formState, setFormState] = useState<FormState>('idle');
  const [formError, setFormError] = useState<string>('');
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    topic: 'Investing' as ContactTopic,
    message: '',
  });

  const t = useMemo(() => content[language], [language]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('submitting');
    setFormError('');

    try {
      await submitContactMessage({
        ...formValues,
      });
      setFormState('success');
      setFormValues({ name: '', email: '', topic: 'Investing', message: '' });
    } catch (err) {
      console.error(err);
      setFormState('error');
      setFormError(t.contactError);
    }
  };

  return (
    <>
      <Head>
        <title>Allen Liu (Min Liu) — AI investor & builder</title>
        <meta
          name="description"
          content="Allen Liu (Min Liu) — building SVTR.ai, investing in AI, running an AI build studio bridging Silicon Valley & Asia."
        />
        <meta property="og:title" content="Allen Liu (Min Liu)" />
        <meta
          property="og:description"
          content="Building SVTR.ai — a cross-border AI founder & investor network. I invest and incubate AI startups, and run an AI build studio."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://liuallen.com" />
      </Head>

      <div className={styles.pageWrapper}>
        <header className={styles.header}>
          <div className={styles.logoArea}>
            <div className={styles.logoDot} aria-hidden />
            <div>
              <span className={styles.logoName}>Allen Liu</span>
              <span className={styles.logoMeta}>Builder • Investor • Connector</span>
            </div>
          </div>
          <nav className={styles.nav} aria-label="Main navigation">
            <a href="#what-i-do">{t.whatIDoTitle}</a>
            <a href="#projects">{t.projectsTitle}</a>
            <a href="#writing">{t.writingTitle}</a>
            <a href="#contact">{t.contactTitle}</a>
            <a href="/apps">Apps</a>
          </nav>
          <div className={styles.actions}>
            <button className={styles.langToggle} onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}>
              {t.languageToggle}
            </button>
            <a className={styles.secondaryButton} href="mailto:allen@liuallen.com">
              {t.email}
            </a>
            <a className={styles.primaryButton} href="https://cal.com/PLACEHOLDER" target="_blank" rel="noreferrer">
              {t.bookCall}
            </a>
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <p className={styles.tagline}>SV-based • Cross-border • AI</p>
              <h1>{t.heroTitle}</h1>
              <p className={styles.heroSubtitle}>{t.heroSubtitle}</p>
              <div className={styles.ctaGroup}>
                <a className={styles.primaryButton} href="https://cal.com/PLACEHOLDER" target="_blank" rel="noreferrer">
                  {t.bookCall}
                </a>
                <a className={styles.secondaryButton} href="mailto:allen@liuallen.com">
                  {t.email}
                </a>
              </div>
              <p className={styles.heroSubline}>{t.heroSubline}</p>
            </div>
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>Currently building</div>
              <div className={styles.heroCardBody}>
                <div className={styles.heroPill}>SVTR.ai</div>
                <p>
                  Cross-border AI founder & investor network with media, programs, and a curated database bridging Silicon Valley
                  and Asia.
                </p>
                <a href="https://svtr.ai" target="_blank" rel="noreferrer" className={styles.cardLink}>
                  Visit SVTR.ai →
                </a>
              </div>
            </div>
          </section>

          <section id="what-i-do" className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Focus</p>
                <h2>{t.whatIDoTitle}</h2>
              </div>
            </div>
            <div className={styles.cardGrid}>
              {t.whatIDoCards.map((card) => (
                <article key={card.title} className={styles.card}>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="projects" className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Builds & Investments</p>
                <h2>{t.projectsTitle}</h2>
              </div>
              <a className={styles.ghostLink} href="/apps">
                Explore apps →
              </a>
            </div>
            <div className={styles.cardGrid}>
              {t.projects.map((project) => (
                <article key={project.name} className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h3>{project.name}</h3>
                    <span className={styles.externalTag}>{project.external ? '↗' : '→'}</span>
                  </div>
                  <p>{project.description}</p>
                  <a
                    className={styles.cardLink}
                    href={project.href}
                    target={project.external ? '_blank' : undefined}
                    rel={project.external ? 'noreferrer' : undefined}
                  >
                    {project.external ? 'Open link' : 'View'}
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="writing" className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Notes</p>
                <h2>{t.writingTitle}</h2>
                <p className={styles.sectionSubtitle}>{t.writingSubtitle}</p>
              </div>
              <a className={styles.ghostLink} href="/writing">
                Writing hub →
              </a>
            </div>
            <div className={styles.listCards}>
              {t.writingItems.map((item) => (
                <article key={item.title} className={styles.listCard}>
                  <div>
                    <h3>{item.title}</h3>
                    <p className={styles.listMeta}>Coming soon</p>
                  </div>
                  <a className={styles.cardLink} href={item.href}>
                    Read →
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="contact" className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Get in touch</p>
                <h2>{t.contactTitle}</h2>
                <p className={styles.sectionSubtitle}>{t.contactSubtitle}</p>
                <a className={styles.cardLink} href="mailto:allen@liuallen.com">
                  allen@liuallen.com
                </a>
              </div>
              <div className={styles.contactMeta}>
                <p>Prefer a call?</p>
                <a className={styles.primaryButton} href="https://cal.com/PLACEHOLDER" target="_blank" rel="noreferrer">
                  {t.bookCall}
                </a>
              </div>
            </div>

            <form className={styles.contactForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>{t.nameLabel}</span>
                  <input
                    required
                    name="name"
                    value={formValues.name}
                    onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  />
                </label>
                <label className={styles.formField}>
                  <span>{t.emailLabel}</span>
                  <input
                    required
                    name="email"
                    type="email"
                    value={formValues.email}
                    onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                  />
                </label>
              </div>

              <label className={styles.formField}>
                <span>{t.topicLabel}</span>
                <select
                  name="topic"
                  value={formValues.topic}
                  onChange={(e) => setFormValues({ ...formValues, topic: e.target.value as ContactTopic })}
                >
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.formField}>
                <span>{t.messageLabel}</span>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={formValues.message}
                  onChange={(e) => setFormValues({ ...formValues, message: e.target.value })}
                />
              </label>

              <div className={styles.formActions}>
                <button type="submit" className={styles.primaryButton} disabled={formState === 'submitting'}>
                  {formState === 'submitting' ? 'Sending...' : t.submitLabel}
                </button>
                {formState === 'success' && <p className={styles.successText}>{t.contactSuccess}</p>}
                {formState === 'error' && <p className={styles.errorText}>{formError}</p>}
              </div>
            </form>
          </section>
        </main>

        <footer className={styles.footer}>
          <div>
            <p className={styles.footerTitle}>Allen Liu (Min Liu)</p>
            <p className={styles.footerMeta}>Building SVTR.ai • Investing & incubating AI • AI build studio</p>
          </div>
          <div className={styles.footerLinks}>
            <a href="mailto:allen@liuallen.com">Email</a>
            <a href="https://cal.com/PLACEHOLDER" target="_blank" rel="noreferrer">
              Book a call
            </a>
            <a href="/apps">Apps</a>
            <a href="/writing">Writing</a>
          </div>
        </footer>
      </div>
    </>
  );
}
