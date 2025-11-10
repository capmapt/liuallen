// 应用数据配置
const apps = [
    {
        id: 'hanzi-teacher',
        name: 'AI汉字老师',
        icon: '🇨🇳',
        description: '交互式汉字学习应用，通过语音识别、笔画动画和智能讲解帮助学习汉字书写',
        longDescription: '基于Web Speech API的智能汉字学习应用。支持语音识别输入、实时笔画动画演示、智能语音讲解。内置258个常用汉字，采用Hanzi Writer进行笔画渲染，提供沉浸式的学习体验。',
        tags: ['教育', '语音识别', '中文', 'AI'],
        url: 'apps/hanzi-teacher/index.html',
        github: 'https://github.com/capmapt/liuallen',
        version: '1.0.0',
        featured: true
    },
    // 未来可以在这里添加更多应用
    // {
    //     id: 'todo-app',
    //     name: '待办事项',
    //     icon: '✅',
    //     description: '简洁优雅的待办事项管理应用',
    //     longDescription: '...',
    //     tags: ['效率', '工具'],
    //     url: 'apps/todo/index.html',
    //     github: 'https://github.com/capmapt/liuallen',
    //     version: '1.0.0'
    // }
];

// DOM元素
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

// 当前选中的应用
let currentApp = null;

// 初始化
function init() {
    renderApps();
    updateStats();
    setupEventListeners();
}

// 渲染应用列表
function renderApps() {
    appsGrid.innerHTML = '';

    apps.forEach((app, index) => {
        const card = createAppCard(app, index);
        appsGrid.appendChild(card);
    });
}

// 创建应用卡片
function createAppCard(app, index) {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
        <span class="app-icon">${app.icon}</span>
        <h3 class="app-name">${app.name}</h3>
        <p class="app-description">${app.description}</p>
        <div class="app-tags">
            ${app.tags.map(tag => `<span class="app-tag">${tag}</span>`).join('')}
        </div>
    `;

    card.addEventListener('click', () => showAppModal(app));

    return card;
}

// 显示应用详情模态框
function showAppModal(app) {
    currentApp = app;

    modalIcon.textContent = app.icon;
    modalTitle.textContent = app.name;
    modalDescription.textContent = app.longDescription || app.description;
    modalTags.innerHTML = app.tags.map(tag => `<span class="app-tag">${tag}</span>`).join('');
    githubBtn.href = app.github;

    appModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭模态框
function closeModal() {
    appModal.classList.remove('active');
    document.body.style.overflow = '';
    currentApp = null;
}

// 启动应用
function launchApp() {
    if (currentApp) {
        window.location.href = currentApp.url;
    }
}

// 更新统计数据
function updateStats() {
    appCount.textContent = apps.length;
}

// 设置事件监听器
function setupEventListeners() {
    // 关闭模态框
    modalClose.addEventListener('click', closeModal);

    appModal.addEventListener('click', (e) => {
        if (e.target === appModal) {
            closeModal();
        }
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && appModal.classList.contains('active')) {
            closeModal();
        }
    });

    // 启动应用按钮
    launchBtn.addEventListener('click', launchApp);

    // 导航链接平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // 更新导航激活状态
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });

    // 滚动时更新导航激活状态
    window.addEventListener('scroll', updateActiveNav);
}

// 更新导航激活状态
function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 导出配置供其他模块使用
export { apps };
