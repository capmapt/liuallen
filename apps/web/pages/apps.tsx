import Head from 'next/head';
import Script from 'next/script';

export default function AppsPage() {
  return (
    <>
      <Head>
        <title>刘Allen的应用商店</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="探索刘Allen打造的效率、学习与创意工具，在线体验精选应用。"
        />
      </Head>

      <header className="header">
        <div className="container">
          <h1 className="logo">
            <span aria-hidden="true">📱</span> 刘Allen的应用
          </h1>
          <nav className="nav" aria-label="主导航">
            <a href="#apps" className="nav-link active">
              应用
            </a>
            <a href="#about" className="nav-link">
              关于
            </a>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <section className="hero">
            <h2 className="hero-title">欢迎来到我的应用商店</h2>
            <p className="hero-subtitle">
              探索我打造的效率、学习与创意工具。所有应用均支持在线体验，并持续迭代更新。
            </p>
            <div className="hero-cta">
              <span className="hero-pill">⚡ 即刻体验 · 🧠 智能助力 · 💡 持续更新</span>
            </div>
          </section>

          <section id="apps" className="apps-section" aria-labelledby="apps-heading">
            <div className="section-header">
              <h3 id="apps-heading" className="section-title">
                精选应用
              </h3>
              <p id="resultSummary" className="section-subtitle">
                正在加载应用...
              </p>
            </div>

            <div className="filters" role="search">
              <div className="search-field">
                <label className="visually-hidden" htmlFor="searchInput">
                  搜索应用
                </label>
                <span className="search-icon" aria-hidden="true">
                  🔍
                </span>
                <input id="searchInput" type="search" placeholder="搜索应用、关键词或标签" autoComplete="off" />
              </div>
              <button id="clearFilterBtn" type="button" className="btn btn-tertiary" disabled>
                重置筛选
              </button>
            </div>

            <div id="tagFilters" className="tag-filter-bar" aria-label="标签筛选" />

            <div className="apps-grid" id="appsGrid" />
          </section>

          <section id="about" className="about-section">
            <h3 className="section-title">关于</h3>
            <div className="about-content">
              <p>这是一个个人应用商店，收集了我开发的各种有趣的Web应用。</p>
              <p>所有应用都是开源的，基于现代Web技术构建，并通过自动化部署持续更新。</p>
              <div className="stats">
                <div className="stat-item">
                  <div className="stat-number" id="appCount">
                    0
                  </div>
                  <div className="stat-label">应用数量</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">开源</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">0</div>
                  <div className="stat-label">广告</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 刘Allen. All rights reserved.</p>
          <p>
            <a href="https://github.com/capmapt/liuallen" target="_blank" rel="noreferrer" className="footer-link">
              GitHub
            </a>
          </p>
        </div>
      </footer>

      <div id="appModal" className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div className="modal-content">
          <button className="modal-close" type="button" aria-label="关闭">
            &times;
          </button>
          <div className="modal-body">
            <div className="modal-icon" id="modalIcon" aria-hidden="true" />
            <h2 className="modal-title" id="modalTitle" />
            <p className="modal-description" id="modalDescription" />
            <div className="modal-tags" id="modalTags" />
            <div className="modal-actions">
              <button className="btn btn-primary" id="launchBtn" type="button">
                启动应用
              </button>
              <a className="btn btn-secondary" id="githubBtn" target="_blank" rel="noopener">
                查看源码
              </a>
            </div>
          </div>
        </div>
      </div>

      <Script src="/assets/js/store.js" type="module" strategy="afterInteractive" />
    </>
  );
}
