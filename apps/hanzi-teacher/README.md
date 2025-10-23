# AI汉字老师 🇨🇳

交互式汉字学习应用，通过语音识别、笔画动画和智能讲解帮助学习汉字书写。

## ✨ 功能特性

- **🎤 语音识别学习**: 说出想学的汉字，AI自动识别并开始教学
- **✍️ 笔画动画演示**: 使用Hanzi Writer展示标准笔画顺序
- **🔊 智能语音讲解**: 每一笔的名称和书写原则都有语音指导
- **📚 常用汉字字典**: 内置258个常用汉字及其笔画数据
- **🔄 降级支持**: 不支持语音时自动切换到手动输入模式
- **📱 响应式设计**: 支持桌面和移动设备

## 🚀 使用方法

### 语音模式
1. 点击麦克风按钮
2. 说出想学的汉字，支持多种说法：
   - "一字"
   - "人字怎么写"
   - "木材的材"
   - 直接说汉字

### 手动模式
如果浏览器不支持语音识别，会自动显示输入框：
1. 在输入框中输入汉字
2. 按回车开始学习

## 🌐 浏览器兼容性

| 功能 | Chrome | Edge | Safari | Firefox |
|------|--------|------|--------|---------|
| 基础功能 | ✅ 25+ | ✅ 79+ | ✅ 14.1+ | ✅ 62+ |
| 语音识别 | ✅ | ✅ | ⚠️ 有限 | ❌ |
| 语音合成 | ✅ | ✅ | ✅ | ✅ |

**推荐浏览器**: Chrome 或 Edge（完整语音功能支持）

## 🛠️ 技术栈

- **语音识别**: Web Speech API (SpeechRecognition)
- **语音合成**: Web Speech API (SpeechSynthesis)
- **汉字渲染**: Hanzi Writer v3.5
- **前端框架**: 原生JavaScript (ES6 Modules)
- **样式**: 内联CSS

## 📊 性能优化

- ✅ 笔画解析缓存 - 避免重复计算
- ✅ 数据文件优化 - 从167KB减至12KB
- ✅ 配置常量提取 - 便于调整和维护
- ✅ 懒加载机制 - 按需加载Hanzi Writer数据

## 📁 文件结构

```
hanzi-teacher/
├── index.html     # 应用主页
├── js/
│   ├── app.js    # 核心应用逻辑
│   ├── data.js   # 汉字数据字典
│   └── speak.js  # 语音合成模块
└── README.md     # 应用文档
```

## 🔧 配置选项

可在 `js/app.js` 中修改配置：

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

## 📝 数据格式

### 笔画映射表 (strokeMap)
```javascript
{
  'h': '横',
  's': '竖',
  'p': '撇',
  'd': '点',
  'n': '捺'
  // ... 共35种笔画
}
```

### 汉字数据 (compressedStrokeData)
```javascript
{
  '一': 'h',                    // 压缩格式
  '人': 'pn',                   // 撇+捺
  '文': ['点', '横', '撇', '捺']  // 数组格式
}
```

### 书写原则 (principleData)
```javascript
{
  '十': {
    rule: '先横后竖',
    explanation: '写"十"字，要记住"先横后竖"的原则哦。'
  }
}
```

## 🐛 已知限制

- Firefox不支持Web Speech Recognition API（仅手动模式）
- Safari的语音识别功能有限
- 需要HTTPS环境才能使用麦克风（localhost除外）
- 首次加载需要从CDN下载Hanzi Writer库

## 📄 开源协议

本应用采用 MIT 协议开源

## 🙏 致谢

- [Hanzi Writer](https://hanziwriter.org/) - 优秀的汉字笔画动画库
- Web Speech API - 浏览器原生语音能力

---

[← 返回应用商店](../../index.html)
