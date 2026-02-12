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
        'I build SVTR.AI, invest in early AI startups, and run an operator-led build studio for founders entering the U.S. market.',
      primaryCta: 'Book a meeting',
      secondaryCta: 'Email',
      availability: 'Based near Stanford / Palo Alto. Open to: founders, investors, partners.',
      badges: ['AI founders + investors', 'Cross-border network', 'Silicon Valley'],
      cardTitle: 'SVTR.AI ecosystem',
      cardBody:
        'Media, curated community, private events, and data products that connect AI founders, investors, and operators across the U.S. and China.',
      cardCta: 'Explore SVTR.AI',
    },
    proof: {
      kicker: 'Proof',
      title: 'Execution with measurable outcomes',
      subtitle: 'A growing platform across community, content, and capital.',
      items: [
        { value: '50+', label: 'Founder and investor events hosted', note: 'Closed-door salons + open ecosystem events' },
        { value: '1,000+', label: 'Cross-border operators in network', note: 'Founders, investors, and senior builders' },
        { value: '$100M+', label: 'Capital touchpoints supported', note: 'Fundraising, introductions, and diligence workflows' },
      ],
    },
    whatIDo: {
      kicker: 'What I do',
      title: 'Building the SVTR.AI ecosystem',
      subtitle: 'Three ways I support AI founders and investors.',
      cards: [
        {
          title: 'SVTR.AI Ecosystem',
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
    audience: {
      kicker: 'Who I help',
      title: 'Support tracks by audience type',
      subtitle: 'Clear outcomes for founders, investors, and ecosystem partners.',
      cards: [
        {
          title: 'Founders',
          outcomes: [
            'US market entry support and strategic distribution',
            'Product build velocity with an operator-led studio',
            'Warm investor and customer introductions',
          ],
        },
        {
          title: 'Investors',
          outcomes: [
            'Sourced dealflow from cross-border AI teams',
            'Sector intelligence from builders and operators',
            'Diligence support through trusted local context',
          ],
        },
        {
          title: 'Partners',
          outcomes: [
            'Co-branded events for high-signal audiences',
            'Access to founder and investor communities',
            'Strategic collaborations across U.S. and China',
          ],
        },
      ],
    },
    projects: {
      kicker: 'Selected projects',
      title: 'Projects & initiatives',
      subtitle: 'Focused on ecosystem building, investing, and founder enablement.',
      cards: [
        {
          title: 'SVTR.AI',
          description: 'Cross-border AI founder & investor network.',
          href: 'https://svtr.ai',
          linkLabel: 'Visit SVTR.AI',
        },
        {
          title: 'AI 创投库',
          description: 'Curated AI founder and investor intelligence database.',
          href: '#contact',
          linkLabel: 'Join waitlist',
        },
        {
          title: 'AI 创投会 / AI 创投营',
          description: 'Founder-first salons and sprint programs for product and fundraising.',
          href: 'https://svtr.ai',
          linkLabel: 'Request invite',
        },
        {
          title: 'PK Capital',
          description: 'Operator support for AI investment and market expansion.',
          href: 'https://www.pingkangcapital.com/',
          linkLabel: 'Visit PK Capital',
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
      subtitle: 'Research briefs, market notes, and operator playbooks.',
      items: [
        {
          title: 'How cross-border founder density compounds over time',
          href: '/writing',
          meta: 'Ecosystem Strategy',
        },
        {
          title: 'What AI infrastructure founders should optimize first',
          href: '/writing',
          meta: 'Founder Playbook',
        },
        {
          title: 'Operator frameworks for early-stage AI execution',
          href: '/writing',
          meta: 'Operating Systems',
        },
      ],
    },
    channels: {
      kicker: 'Media channels',
      title: 'Where to follow my work',
      subtitle: 'Best channels for updates, events, and collaboration.',
      links: [
        { title: 'SVTR.AI', href: 'https://svtr.ai', label: 'Platform updates' },
        { title: 'Email', href: 'mailto:liumin.gsm@gmail.com', label: 'Direct contact' },
        { title: 'Apps', href: '/apps', label: 'Product experiments' },
      ],
    },
    disclosure: {
      kicker: 'Disclosure',
      title: 'Operating principles and boundaries',
      items: [
        'Community and media activities are independent from formal investment decisions.',
        'Content on this site is for informational purposes and not investment advice.',
        'Potential conflicts are handled with explicit disclosure and recusal when needed.',
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
        '我在搭建 SVTR.AI、投资早期 AI 公司，并运营以交付为导向的 AI 搭建工作室，帮助创始人进入美国市场。',
      primaryCta: '预约会议',
      secondaryCta: '发送邮件',
      availability: '常驻斯坦福 / 帕洛阿尔托附近。开放合作：创业者、投资人、合作伙伴。',
      badges: ['AI 创业者 + 投资人', '跨境生态', '硅谷'],
      cardTitle: 'SVTR.AI 生态',
      cardBody: '媒体、社区、活动与数据库，连接中美 AI 创业者、投资人和运营者。',
      cardCta: '了解 SVTR.AI',
    },
    proof: {
      kicker: '成果',
      title: '用可量化结果验证执行力',
      subtitle: '在社区、内容与资本连接上持续增长。',
      items: [
        { value: '50+', label: '已举办创业者与投资人活动', note: '闭门沙龙 + 开放生态活动' },
        { value: '1,000+', label: '跨境网络覆盖运营者', note: '覆盖创业者、投资人与资深建设者' },
        { value: '$100M+', label: '支持资本连接触达规模', note: '覆盖融资、引荐与尽调协同' },
      ],
    },
    whatIDo: {
      kicker: '我在做什么',
      title: '建设 SVTR.AI 生态',
      subtitle: '支持 AI 创业者与投资人的三种方式。',
      cards: [
        {
          title: 'SVTR.AI 生态',
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
    audience: {
      kicker: '服务对象',
      title: '按角色设计支持路径',
      subtitle: '面向创业者、投资人和合作伙伴的明确产出。',
      cards: [
        {
          title: '创业者',
          outcomes: [
            '美国市场进入与分发策略支持',
            '通过搭建工作室提升产品交付速度',
            '连接高质量投资人与关键客户',
          ],
        },
        {
          title: '投资人',
          outcomes: [
            '获取跨境 AI 创业项目流',
            '获得来自一线建设者的赛道洞察',
            '通过本地语境增强尽调判断',
          ],
        },
        {
          title: '合作伙伴',
          outcomes: [
            '面向高密度人群的联合活动',
            '进入创业者与投资人社群网络',
            '推动中美双向战略合作',
          ],
        },
      ],
    },
    projects: {
      kicker: '精选项目',
      title: '项目与计划',
      subtitle: '围绕生态建设、投资与创始人赋能。',
      cards: [
        {
          title: 'SVTR.AI',
          description: '跨境 AI 创业者与投资人网络。',
          href: 'https://svtr.ai',
          linkLabel: '访问 SVTR.AI',
        },
        {
          title: 'AI 创投库',
          description: '精选 AI 创业者与投资人情报库。',
          href: '#contact',
          linkLabel: '加入候补',
        },
        {
          title: 'AI 创投会 / AI 创投营',
          description: '面向创始人的沙龙与冲刺营。',
          href: 'https://svtr.ai',
          linkLabel: '申请邀约',
        },
        {
          title: 'PK Capital',
          description: 'AI 投资与市场扩张的运营支持。',
          href: 'https://www.pingkangcapital.com/',
          linkLabel: '访问 PK Capital',
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
      subtitle: '研究简报、市场观察与运营方法。',
      items: [
        {
          title: '跨境创业者密度如何形成复利',
          href: '/writing',
          meta: '生态策略',
        },
        {
          title: 'AI 基础设施创始人应优先优化什么',
          href: '/writing',
          meta: '创始人手册',
        },
        {
          title: '早期 AI 团队的运营执行框架',
          href: '/writing',
          meta: '运营系统',
        },
      ],
    },
    channels: {
      kicker: '媒体渠道',
      title: '关注我的工作动态',
      subtitle: '获取更新、活动与合作信息的最佳入口。',
      links: [
        { title: 'SVTR.AI', href: 'https://svtr.ai', label: '平台更新' },
        { title: '邮箱', href: 'mailto:liumin.gsm@gmail.com', label: '直接联系' },
        { title: '应用商店', href: '/apps', label: '产品实验' },
      ],
    },
    disclosure: {
      kicker: '披露说明',
      title: '协作原则与边界',
      items: [
        '社区和媒体活动与正式投资决策相互独立。',
        '本站内容仅供信息参考，不构成投资建议。',
        '若存在潜在利益冲突，将进行明确披露并按需回避。',
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
        <title>Allen Liu (Min Liu) — SVTR.AI ecosystem builder</title>
        <meta
          name="description"
          content="Allen Liu (Min Liu): building SVTR.AI, investing in AI startups, and operating a cross-border AI build studio."
        />
        <meta property="og:title" content="Allen Liu (Min Liu) — SVTR.AI ecosystem builder" />
        <meta
          property="og:description"
          content="Building SVTR.AI, investing in AI startups, and operating an AI build studio for founders."
        />
        <meta property="og:url" content="https://liuallen.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Allen Liu (Min Liu)" />
        <meta
          name="twitter:description"
          content="SVTR.AI ecosystem builder, AI investor, and operator for founder teams."
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
              <span className={styles.brandMeta}>SVTR.AI founder · AI investor</span>
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
            <small>SVTR.AI</small>
            <h3>{t.hero.cardTitle}</h3>
            <p>{t.hero.cardBody}</p>
            <a className={styles.secondaryBtn} href="https://svtr.ai" target="_blank" rel="noreferrer">
              {t.hero.cardCta}
            </a>
          </div>
        </section>

        <section id="proof" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>{t.proof.kicker}</p>
              <h2 className={styles.sectionTitle}>{t.proof.title}</h2>
              <p className={styles.sectionSubtitle}>{t.proof.subtitle}</p>
            </div>
          </div>
          <div className={styles.proofGrid}>
            {t.proof.items.map((item) => (
              <article key={item.label} className={styles.proofCard}>
                <p className={styles.proofValue}>{item.value}</p>
                <h3>{item.label}</h3>
                <p>{item.note}</p>
              </article>
            ))}
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

        <section id="who-i-help" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>{t.audience.kicker}</p>
              <h2 className={styles.sectionTitle}>{t.audience.title}</h2>
              <p className={styles.sectionSubtitle}>{t.audience.subtitle}</p>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {t.audience.cards.map((group) => (
              <article key={group.title} className={styles.card}>
                <h3>{group.title}</h3>
                <ul className={styles.outcomeList}>
                  {group.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
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
                  <a
                    href={project.href}
                    className={styles.cardLink}
                    target={project.href.startsWith('http') ? '_blank' : undefined}
                    rel={project.href.startsWith('http') ? 'noreferrer' : undefined}
                  >
                    {project.linkLabel}
                  </a>
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

        <section id="channels" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>{t.channels.kicker}</p>
              <h2 className={styles.sectionTitle}>{t.channels.title}</h2>
              <p className={styles.sectionSubtitle}>{t.channels.subtitle}</p>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {t.channels.links.map((channel) => (
              <article key={channel.title} className={styles.card}>
                <h3>{channel.title}</h3>
                <p>{channel.label}</p>
                <a
                  href={channel.href}
                  className={styles.cardLink}
                  target={channel.href.startsWith('http') ? '_blank' : undefined}
                  rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}
                >
                  {channel.href.startsWith('mailto:') ? channel.href.replace('mailto:', '') : channel.href}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="disclosure" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.subtle}>{t.disclosure.kicker}</p>
              <h2 className={styles.sectionTitle}>{t.disclosure.title}</h2>
            </div>
          </div>
          <div className={styles.disclosureBox}>
            <ul className={styles.disclosureList}>
              {t.disclosure.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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
          <span>liuallen.com · SVTR.AI</span>
        </footer>
      </div>
    </div>
  );
}
