// 应用数据源
const DATA_URL = 'assets/data/apps.json';

// DOM 元素
const appsGrid = document.getElementById('appsGrid');
const appModal = document.getElementById('appModal');
const modalClose = document.querySelector('.modal-close');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalTags = document.getElementById('modalTags');
const launchBtn = document.getElementById('launchBtn');
const githubBtn = document.getElementById('githubBtn');
const appCount = document.getElementById('appCount');
const searchInput = document.getElementById('searchInput');
const tagFilters = document.getElementById('tagFilters');
const clearFilterBtn = document.getElementById('clearFilterBtn');
const resultSummary = document.getElementById('resultSummary');

// 状态
let apps = [];
let filteredApps = [];
let currentApp = null;
const state = {
    keyword: '',
    tags: new Set()
};

async function init() {
    await loadApps();
    renderTagFilters();
    applyFilters();
    updateStats();
    setupEventListeners();
    handleHashChange({ initial: true });
}

async function loadApps() {
    try {
        const response = await fetch(DATA_URL, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`无法加载应用数据: ${response.status}`);
        }
        apps = await response.json();
    } catch (error) {
        console.error(error);
        appsGrid.innerHTML = `
            <div class="empty-state">
                <h4>应用列表加载失败</h4>
                <p>请刷新页面或稍后再试。</p>
            </div>
        `;
        apps = [];
    }
}

function renderTagFilters() {
    if (!tagFilters) return;

    const allTags = Array.from(new Set(apps.flatMap(app => app.tags || []))).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

    if (allTags.length === 0) {
        tagFilters.innerHTML = '<span class="filter-placeholder">暂无标签</span>';
        return;
    }

    tagFilters.innerHTML = '';

    allTags.forEach(tag => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'filter-chip';
        button.textContent = tag;
        button.dataset.tag = tag;
        button.addEventListener('click', () => toggleTag(tag));
        tagFilters.appendChild(button);
    });

    updateTagFilterState();
}

function toggleTag(tag) {
    if (state.tags.has(tag)) {
        state.tags.delete(tag);
    } else {
        state.tags.add(tag);
    }
    updateTagFilterState();
    applyFilters();
}

function clearFilters() {
    state.tags.clear();
    state.keyword = '';
    if (searchInput) {
        searchInput.value = '';
    }
    updateTagFilterState();
    applyFilters();
}

function updateTagFilterState() {
    if (!tagFilters) return;

    Array.from(tagFilters.children).forEach(button => {
        const tag = button.dataset.tag;
        if (state.tags.has(tag)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    if (clearFilterBtn) {
        clearFilterBtn.disabled = state.tags.size === 0 && state.keyword.trim() === '';
    }
}

function applyFilters() {
    const keyword = state.keyword.trim().toLowerCase();

    filteredApps = apps.filter(app => {
        const matchesKeyword = !keyword || [app.name, app.description, app.longDescription]
            .filter(Boolean)
            .some(text => text.toLowerCase().includes(keyword));

        const matchesTags = state.tags.size === 0 || (app.tags || []).some(tag => state.tags.has(tag));

        return matchesKeyword && matchesTags;
    });

    renderApps();
    updateStats();
    updateResultSummary();
}

function renderApps() {
    appsGrid.innerHTML = '';

    if (filteredApps.length === 0) {
        appsGrid.innerHTML = `
            <div class="empty-state">
                <h4>未找到匹配的应用</h4>
                <p>尝试调整搜索关键词或标签筛选。</p>
            </div>
        `;
        return;
    }

    filteredApps.forEach((app, index) => {
        const card = createAppCard(app, index);
        appsGrid.appendChild(card);
    });
}

function createAppCard(app, index) {
    const card = document.createElement('article');
    card.className = 'app-card';
    card.style.animationDelay = `${index * 0.08}s`;
    card.setAttribute('data-app-id', app.id);
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
        <span class="app-icon" aria-hidden="true">${app.icon}</span>
        <h3 class="app-name">${app.name}</h3>
        <p class="app-description">${app.description}</p>
        <div class="app-meta">
            <span class="app-version">v${app.version || '1.0.0'}</span>
            ${app.featured ? '<span class="app-badge">精选</span>' : ''}
        </div>
        <div class="app-tags">
            ${(app.tags || []).map(tag => `<span class="app-tag">${tag}</span>`).join('')}
        </div>
    `;

    card.addEventListener('click', () => showAppModal(app));
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showAppModal(app);
        }
    });

    return card;
}

function showAppModal(app, { skipHashUpdate = false } = {}) {
    currentApp = app;

    modalIcon.textContent = app.icon;
    modalTitle.textContent = app.name;
    modalDescription.textContent = app.longDescription || app.description;
    modalTags.innerHTML = (app.tags || []).map(tag => `<span class="app-tag">${tag}</span>`).join('');
    launchBtn.disabled = !app.url;

    if (app.url) {
        launchBtn.setAttribute('data-url', app.url);
    } else {
        launchBtn.removeAttribute('data-url');
    }

    if (app.github) {
        githubBtn.href = app.github;
        githubBtn.removeAttribute('aria-disabled');
    } else {
        githubBtn.removeAttribute('href');
        githubBtn.setAttribute('aria-disabled', 'true');
    }

    appModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (!skipHashUpdate) {
        const newUrl = `${window.location.pathname}${window.location.search}#${app.id}`;
        history.replaceState(null, '', newUrl);
    }
}

function closeModal({ skipHashUpdate = false } = {}) {
    appModal.classList.remove('active');
    document.body.style.overflow = '';
    currentApp = null;

    if (!skipHashUpdate) {
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
}

function launchApp() {
    if (!currentApp) return;

    const url = currentApp.url || launchBtn.getAttribute('data-url');
    if (url) {
        window.open(url, '_blank', 'noopener');
    }
}

function updateStats() {
    if (appCount) {
        appCount.textContent = apps.length;
    }
}

function updateResultSummary() {
    if (!resultSummary) return;

    const total = apps.length;
    const filtered = filteredApps.length;
    if (state.keyword.trim() === '' && state.tags.size === 0) {
        resultSummary.textContent = `当前共上架 ${total} 款应用`;
    } else {
        resultSummary.textContent = `筛选结果：${filtered} / ${total}`;
    }
}

function setupEventListeners() {
    if (modalClose) {
        modalClose.addEventListener('click', () => closeModal());
    }

    appModal.addEventListener('click', (event) => {
        if (event.target === appModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && appModal.classList.contains('active')) {
            closeModal();
        }
    });

    if (launchBtn) {
        launchBtn.addEventListener('click', launchApp);
    }

    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            state.keyword = event.target.value;
            updateTagFilterState();
            applyFilters();
        });
    }

    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', clearFilters);
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (event) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });

            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            this.classList.add('active');
        });
    });

    window.addEventListener('scroll', updateActiveNav);
    window.addEventListener('hashchange', () => handleHashChange());
}

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 120;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
            });
        }
    });
}

function handleHashChange({ initial = false } = {}) {
    const hash = decodeURIComponent(window.location.hash.replace('#', ''));

    if (!hash) {
        if (!initial && appModal.classList.contains('active')) {
            closeModal({ skipHashUpdate: true });
        }
        return;
    }

    const targetApp = apps.find(app => app.id === hash);
    if (targetApp) {
        showAppModal(targetApp, { skipHashUpdate: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { apps };
