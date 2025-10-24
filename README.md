# 刘Allen的应用商店 🚀

一个现代化的个人Web应用商店，展示和托管各种实用有趣的Web应用。

## 🌟 在线访问

访问 [https://liuallen.com](https://liuallen.com) 浏览所有应用

## 📱 应用列表

### 1. AI汉字老师 🇨🇳

**类别**: 教育 · 语音识别 · 中文 · AI

交互式汉字学习应用，通过语音识别、笔画动画和智能讲解帮助学习汉字书写。

**功能特性**:
- 🎤 语音识别学习
- ✍️ 笔画动画演示
- 🔊 智能语音讲解
- 📚 258个常用汉字
- 🔄 降级支持（手动输入）

**技术栈**: Web Speech API · Hanzi Writer · ES6

[查看详情](apps/hanzi-teacher/) · [立即使用](apps/hanzi-teacher/index.html)

### 2. Focus Flow 专注计时器 ⏱️

**类别**: 效率 · 工具 · 时间管理

番茄工作法计时器，帮助你规划专注与休息节奏，支持快捷键、桌面通知与进度统计。

**功能特性**:
- ⏳ 自定义专注 / 休息时长
- 🔔 桌面通知提醒轮次切换
- 🎯 番茄数统计与目标追踪
- ⌨️ 空格键快捷开始 / 暂停

**技术栈**: 原生 JavaScript · Web Notifications API

[立即使用](apps/focus-flow/index.html)

### 3. Markdown 灵感笔记 📝

**类别**: 创意 · 效率 · 笔记

所见即所得的 Markdown 速记本，内置模板与快捷键，自动保存在浏览器本地。

**功能特性**:
- 🪄 一键插入常用笔记模板
- 📝 实时预览与快捷键格式化
- ☁️ 浏览器本地自动保存
- 🧩 支持标准 Markdown 语法

**技术栈**: 原生 JavaScript · Marked

[立即使用](apps/markdown-notes/index.html)

---

## 🏗️ 项目结构

```
liuallen/
├── index.html              # 应用商店主页
├── assets/
│   ├── css/
│   │   └── store.css      # 商店样式
│   ├── data/
│   │   └── apps.json      # 应用元数据（搜索/筛选数据源）
│   ├── js/
│   │   └── store.js       # 商店逻辑
│   └── images/
│       └── apps/          # 应用图标
├── apps/
│   ├── focus-flow/        # Focus Flow 专注计时器
│   │   └── index.html
│   ├── hanzi-teacher/     # AI汉字老师应用
│   │   ├── index.html
│   │   ├── js/
│   │   │   ├── app.js
│   │   │   ├── data.js
│   │   │   └── speak.js
│   │   └── README.md
│   └── markdown-notes/    # Markdown 灵感笔记
│       └── index.html
├── scripts/
│   └── clean-data.js      # 数据清理工具
├── README.md              # 主文档
└── .gitignore
```

## 🚀 快速开始

### 本地运行

1. **克隆仓库**
```bash
git clone https://github.com/capmapt/liuallen.git
cd liuallen
```

2. **启动本地服务器**
```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx http-server

# 或使用PHP
php -S localhost:8000
```

3. **访问应用**
```
http://localhost:8000
```

### 部署到生产环境

应用商店是纯静态网站，可以部署到任何静态托管服务：

- **Vercel**: `vercel --prod`
- **Netlify**: 拖放部署或连接Git仓库
- **GitHub Pages**: 启用Pages并选择分支
- **Cloudflare Pages**: 连接仓库自动部署

## 🎨 设计特点

### 现代化UI
- 🎯 Apple风格设计语言
- 🌈 渐变色彩方案
- ⚡ 流畅动画效果
- 📱 完全响应式布局

### 用户体验
- 🔍 实时搜索与标签筛选
- 🗂️ 应用详情模态框
- 🎭 平滑过渡动画
- ⌨️ 键盘快捷键支持
- 🖱️ 悬停效果反馈

### 技术实现
- 💡 原生JavaScript (无框架)
- 🎨 CSS Grid + Flexbox布局
- 🚫 零依赖（除应用本身）
- ⚡ 极快加载速度

## 🔧 添加新应用

### 1. 创建应用目录

```bash
mkdir -p apps/your-app-name
```

### 2. 添加应用文件

在 `apps/your-app-name/` 中创建：
- `index.html` - 应用入口
- `README.md` - 应用文档（可选）
- 其他必要文件

### 3. 注册应用

编辑 `assets/data/apps.json`，在数组中添加应用元数据：

```json
{
  "id": "your-app-name",
  "name": "您的应用名称",
  "icon": "📱",
  "description": "简短描述",
  "longDescription": "详细描述（用于模态框）",
  "tags": ["标签1", "标签2"],
  "url": "apps/your-app-name/index.html",
  "github": "https://github.com/capmapt/liuallen",
  "version": "1.0.0",
  "featured": false
}
```

> 提示：`featured` 为 `true` 时会在卡片上展示“精选”徽章。

### 4. 测试并提交

```bash
# 本地测试
python -m http.server 8000

# 提交更改
git add .
git commit -m "feat: add new app - your-app-name"
git push
```

## 🌐 浏览器兼容性

| 浏览器 | 版本 | 支持状态 |
|--------|------|---------|
| Chrome | 90+ | ✅ 完全支持 |
| Edge | 90+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Firefox | 88+ | ✅ 完全支持 |

**注意**: 某些应用可能需要特定的浏览器功能（如Web Speech API），兼容性请参考各应用文档。

## 📊 性能指标

- **首屏加载**: < 100ms
- **完全交互**: < 200ms
- **总页面大小**: < 50KB (主页)
- **Lighthouse得分**: 95+

## 🛠️ 开发工具

### 脚本命令

```bash
# 清理AI汉字老师数据
node scripts/clean-data.js

# 检查JavaScript语法
node -c assets/js/store.js
```

## 🤝 贡献指南

欢迎贡献新应用或改进现有功能！

### 提交应用

1. Fork本仓库
2. 创建应用分支: `git checkout -b app/your-app-name`
3. 按照上述步骤添加应用
4. 提交PR并描述您的应用

### 改进商店

1. Fork本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

### 代码规范

- 使用ES6+语法
- 保持代码简洁清晰
- 添加必要的注释
- 遵循现有的代码风格

## 📄 开源协议

本项目采用 MIT 协议开源

```
MIT License

Copyright (c) 2025 刘Allen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

## 🙏 致谢

### 技术栈
- [Hanzi Writer](https://hanziwriter.org/) - 汉字笔画动画库
- Web Speech API - 浏览器语音能力
- Modern CSS - 现代CSS特性

### 设计灵感
- Apple App Store - UI设计参考
- Material Design - 动画效果参考

## 📮 联系方式

- **网站**: [liuallen.com](https://liuallen.com)
- **GitHub**: [@capmapt](https://github.com/capmapt)
- **项目地址**: [github.com/capmapt/liuallen](https://github.com/capmapt/liuallen)
- **问题反馈**: [Issues](https://github.com/capmapt/liuallen/issues)

## 📈 更新日志

### v2.0.0 (2025-01-23)
- 🎉 重构为应用商店架构
- ✨ 添加现代化UI设计
- 🚀 优化性能和用户体验
- 📱 完善响应式布局

### v1.0.0 (2025-01-22)
- 🎊 首次发布
- ✅ AI汉字老师应用上线
- 📝 完整文档支持

## 🗺️ 路线图

### 短期计划
- [ ] 添加更多应用
- [ ] 支持应用分类筛选
- [ ] 添加搜索功能
- [ ] 支持暗黑模式

### 长期计划
- [ ] 应用评分系统
- [ ] 用户收藏功能
- [ ] PWA支持（离线访问）
- [ ] 多语言支持

---

**Made with ❤️ by 刘Allen**

*Explore, Learn, Create*
