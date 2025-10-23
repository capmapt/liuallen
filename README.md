# AI汉字老师 🇨🇳

一个基于Web Speech API的交互式汉字学习应用，通过语音识别、笔画动画和智能讲解帮助用户学习汉字书写。

## ✨ 功能特性

- **🎤 语音识别学习**: 说出想学的汉字，AI自动识别并开始教学
- **✍️ 笔画动画演示**: 使用Hanzi Writer展示标准笔画顺序
- **🔊 智能语音讲解**: 每一笔的名称和书写原则都有语音指导
- **📚 常用汉字字典**: 内置258个常用汉字及其笔画数据
- **🔄 降级支持**: 不支持语音时自动切换到手动输入模式
- **📱 响应式设计**: 支持桌面和移动设备

## 🚀 快速开始

### 在线使用

1. 克隆仓库：
```bash
git clone https://github.com/capmapt/liuallen.git
cd liuallen
```

2. 启动本地服务器：
```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx http-server
```

3. 在浏览器中打开：
```
http://localhost:8000
```

### 使用方法

1. **语音模式**：点击麦克风按钮，说出想学的汉字
   - 支持多种说法："一字"、"人字怎么写"、"木材的材"等

2. **手动模式**：如果浏览器不支持语音，直接在输入框中输入汉字

## 🌐 浏览器兼容性

| 功能 | Chrome | Edge | Safari | Firefox |
|------|--------|------|--------|---------|
| 基础功能 | ✅ 25+ | ✅ 79+ | ✅ 14.1+ | ✅ 62+ |
| 语音识别 | ✅ | ✅ | ⚠️ 有限 | ❌ |
| 语音合成 | ✅ | ✅ | ✅ | ✅ |

**推荐浏览器**: Chrome 或 Edge（完整语音功能支持）

## 📁 项目结构

```
liuallen/
├── index.html          # 主页面
├── js/
│   ├── app.js         # 核心应用逻辑 (161行)
│   ├── data.js        # 汉字数据字典 (12KB)
│   └── speak.js       # 语音合成模块 (23行)
├── scripts/
│   └── clean-data.js  # 数据清理工具
└── README.md          # 项目文档
```

## 🛠️ 技术栈

- **前端框架**: 原生JavaScript (ES6 Modules)
- **汉字渲染**: [Hanzi Writer](https://hanziwriter.org/) v3.5
- **语音识别**: Web Speech API (SpeechRecognition)
- **语音合成**: Web Speech API (SpeechSynthesis)
- **样式**: 内联CSS

## 📊 性能优化

本项目经过多项性能优化：

1. **笔画解析缓存**: 避免重复解析，提升响应速度
2. **数据去重优化**: 字典文件从167KB优化至12KB（减少92.8%）
3. **配置常量提取**: 便于调整和维护
4. **懒加载机制**: 按需加载Hanzi Writer数据

## 🔧 配置选项

可在 `js/app.js` 中修改以下配置：

```javascript
const CONFIG = {
    WRITER_SIZE: 300,           // 画布大小
    WRITER_PADDING: 25,         // 画布内边距
    ANIMATION_SPEED: 1.5,       // 动画速度
    STROKE_DELAY: 200,          // 笔画间延迟(ms)
    SPEECH_RATE: 1.2,           // 语音速度
    // ... 更多配置
};
```

## 📝 数据格式说明

### strokeMap - 笔画映射表
```javascript
{
  'h': '横',    // 横
  's': '竖',    // 竖
  'p': '撇',    // 撇
  'd': '点',    // 点
  'n': '捺',    // 捺
  // ... 共35种笔画
}
```

### compressedStrokeData - 汉字数据
```javascript
{
  '一': 'h',                    // 压缩格式：单个横
  '人': 'pn',                   // 压缩格式：撇+捺
  '文': ['点', '横', '撇', '捺']  // 数组格式
}
```

### principleData - 书写原则
```javascript
{
  '十': {
    rule: '先横后竖',
    explanation: '写"十"字，要记住"先横后竖"的原则哦。'
  }
}
```

## 🧪 开发和测试

### 添加新汉字

1. 在 `js/data.js` 的 `compressedStrokeData` 中添加：
```javascript
'新': 'hshpshspnhsphsn',  // 使用压缩格式
```

2. （可选）添加书写原则：
```javascript
principleData['新'] = {
  rule: '先左后右，先上后下',
  explanation: '...'
};
```

### 运行数据清理

如果手动编辑了 `data.js` 并产生重复，运行清理脚本：

```bash
node scripts/clean-data.js
```

## 🐛 已知限制

- Firefox不支持Web Speech Recognition API（仅手动模式可用）
- Safari的语音识别功能有限
- 需要HTTPS环境才能使用麦克风（localhost除外）
- 首次加载需要从CDN下载Hanzi Writer库

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

## 📄 开源协议

本项目采用 MIT 协议开源 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Hanzi Writer](https://hanziwriter.org/) - 优秀的汉字笔画动画库
- Web Speech API - 浏览器原生语音能力
- 所有贡献者和用户

## 📮 联系方式

- 项目主页: [GitHub](https://github.com/capmapt/liuallen)
- 问题反馈: [Issues](https://github.com/capmapt/liuallen/issues)

---

**Made with ❤️ for Chinese learners**
