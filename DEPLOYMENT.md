# 🚀 部署指南

项目已经完全准备好部署！所有配置文件已创建，代码已合并到本地main分支。

## ✅ 已完成的准备工作

- ✅ 应用商店代码完成
- ✅ 性能优化完成
- ✅ 部署配置文件已创建
- ✅ 代码已合并到main分支
- ✅ 发布标签v2.0.0已创建

## 📦 项目状态

**当前版本**: v2.0.0
**本地分支**: main
**特性分支**: claude/project-structure-review-011CUQk8SmnsGxAx3B4kJ6FA（已合并）

## 🌐 部署选项

### 方案1: Vercel (推荐 - 最简单)

Vercel提供最佳的零配置部署体验，已包含 `vercel.json` 配置文件。

#### 步骤：

1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
cd /home/user/liuallen
vercel --prod
```

4. **配置自定义域名**
   - 在Vercel仪表板中添加 `liuallen.com`
   - 按照提示配置DNS记录

**预期结果**:
- 自动HTTPS
- 全球CDN加速
- 每次推送自动部署
- 部署URL: https://liuallen.vercel.app（临时）
- 自定义域名: https://liuallen.com

---

### 方案2: Netlify

Netlify也提供优秀的静态站点托管，已包含 `netlify.toml` 配置。

#### 步骤：

**方式A: 拖放部署（最简单）**

1. 访问 [Netlify](https://app.netlify.com)
2. 登录账号
3. 将整个 `/home/user/liuallen` 文件夹拖放到部署区域
4. 等待部署完成
5. 在Settings > Domain management中配置 `liuallen.com`

**方式B: Git集成（推荐）**

1. 推送代码到GitHub（参见下方说明）
2. 在Netlify中连接GitHub仓库
3. 选择 `capmapt/liuallen` 仓库
4. 分支选择 `main`
5. 构建命令留空（静态站点）
6. 发布目录: `.`
7. 点击"Deploy"

**预期结果**:
- 自动HTTPS
- CDN加速
- 持续部署
- 部署URL: https://liuallen.netlify.app（临时）
- 自定义域名: https://liuallen.com

---

### 方案3: GitHub Pages

已包含自动部署workflow (`.github/workflows/deploy.yml`)。

#### 前提条件：
需要先将main分支推送到GitHub。

#### 步骤：

1. **在GitHub上启用Pages**
   - 访问仓库: https://github.com/capmapt/liuallen
   - Settings > Pages
   - Source: GitHub Actions
   - 保存设置

2. **推送代码触发部署**
```bash
# 在GitHub网页端合并PR或手动上传
# 或者配置SSH密钥后推送
```

3. **配置自定义域名**
   - 在Pages设置中添加 `liuallen.com`
   - 创建 `CNAME` 文件：
   ```bash
   echo "liuallen.com" > /home/user/liuallen/CNAME
   ```

**预期结果**:
- 免费托管
- 自动HTTPS
- URL: https://capmapt.github.io/liuallen/
- 自定义域名: https://liuallen.com

---

### 方案4: Cloudflare Pages

快速且强大的CDN网络。

#### 步骤：

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
2. 连接GitHub账号
3. 选择 `capmapt/liuallen` 仓库
4. 配置：
   - 分支: `main`
   - 构建命令: (留空)
   - 输出目录: `.`
5. 点击"Save and Deploy"
6. 在自定义域名设置中添加 `liuallen.com`

**预期结果**:
- 超快CDN
- 自动HTTPS
- 无限带宽
- URL: https://liuallen.pages.dev
- 自定义域名: https://liuallen.com

---

## 🔧 推送代码到GitHub

如果需要将main分支推送到GitHub（用于GitHub Pages或其他CI/CD）：

### 选项A: 通过GitHub网页

1. 访问 https://github.com/capmapt/liuallen
2. 创建Pull Request从 `claude/project-structure-review-011CUQk8SmnsGxAx3B4kJ6FA` 到 `main`
3. 合并PR

### 选项B: 本地配置

如果你有GitHub的SSH或Personal Access Token:

```bash
# 使用SSH
git remote set-url origin git@github.com:capmapt/liuallen.git

# 或使用Personal Access Token
git remote set-url origin https://YOUR_TOKEN@github.com/capmapt/liuallen.git

# 然后推送
git push origin main
git push origin v2.0.0
```

---

## 📋 DNS配置

部署完成后，配置DNS指向你的部署服务：

### Vercel
```
A记录: @ -> 76.76.21.21
CNAME: www -> cname.vercel-dns.com
```

### Netlify
```
A记录: @ -> 75.2.60.5
CNAME: www -> [your-site].netlify.app
```

### Cloudflare Pages
```
CNAME: @ -> [your-site].pages.dev
CNAME: www -> [your-site].pages.dev
```

### GitHub Pages
```
A记录: @ -> 185.199.108.153
A记录: @ -> 185.199.109.153
A记录: @ -> 185.199.110.153
A记录: @ -> 185.199.111.153
CNAME: www -> capmapt.github.io
```

---

## ✨ 部署后验证

部署完成后，访问 https://liuallen.com 应该看到：

1. ✅ 应用商店主页加载正常
2. ✅ AI汉字老师卡片显示
3. ✅ 点击卡片显示模态框
4. ✅ 点击"启动应用"进入AI汉字老师
5. ✅ AI汉字老师功能正常
6. ✅ 返回主页按钮工作正常

---

## 🚨 常见问题

### Q: 推送到main分支失败
**A**: 根据项目配置，只允许推送以`claude/`开头的分支。建议使用Vercel/Netlify拖放部署，或在GitHub网页端合并PR。

### Q: 如何更新已部署的站点？
**A**:
- **Vercel/Netlify**: 只需运行 `vercel --prod` 或重新拖放
- **GitHub Pages**: 推送到main分支自动部署
- **Cloudflare Pages**: 推送到main分支自动部署

### Q: 自定义域名不工作
**A**:
1. 确认DNS记录已正确配置
2. DNS传播需要几分钟到几小时
3. 使用 `dig liuallen.com` 检查DNS

---

## 📞 需要帮助？

- **Vercel文档**: https://vercel.com/docs
- **Netlify文档**: https://docs.netlify.com
- **GitHub Pages**: https://docs.github.com/pages
- **Cloudflare Pages**: https://developers.cloudflare.com/pages

---

## 🎉 推荐部署方式

**最简单**: Netlify拖放部署
**最专业**: Vercel CLI部署
**最免费**: GitHub Pages

选择任一方式，10分钟内即可完成部署！

---

**准备就绪，选择你的部署方式开始吧！** 🚀
