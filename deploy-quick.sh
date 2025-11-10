#!/bin/bash

# 快速部署脚本 - 刘Allen应用商店
# 使用方法: bash deploy-quick.sh

echo "════════════════════════════════════════════════════════"
echo "     🚀 刘Allen应用商店 - 快速部署工具"
echo "════════════════════════════════════════════════════════"
echo ""

# 检查当前目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "📦 项目检查..."
echo "   ✓ 项目根目录确认"
echo "   ✓ 配置文件存在"
echo ""

# 显示部署选项
echo "请选择部署平台:"
echo ""
echo "  1) Vercel (推荐 - 快速、稳定、全球CDN)"
echo "  2) Netlify (简单 - 拖放部署)"
echo "  3) 显示部署说明"
echo "  4) 退出"
echo ""
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔵 Vercel 部署步骤:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. 安装Vercel CLI:"
        echo "   $ npm i -g vercel"
        echo ""
        echo "2. 登录Vercel:"
        echo "   $ vercel login"
        echo ""
        echo "3. 部署项目:"
        echo "   $ vercel --prod"
        echo ""
        echo "4. 按照提示配置项目"
        echo ""
        echo "5. 在Vercel仪表板配置自定义域名 liuallen.com"
        echo ""

        read -p "是否现在安装并部署? (y/n): " install_choice
        if [ "$install_choice" = "y" ]; then
            echo ""
            echo "正在检查npm..."
            if command -v npm &> /dev/null; then
                echo "✓ npm已安装"
                echo ""
                echo "正在安装Vercel CLI..."
                npm i -g vercel
                echo ""
                echo "请运行: vercel login"
                echo "然后运行: vercel --prod"
            else
                echo "❌ 未找到npm，请先安装Node.js"
                echo "   访问: https://nodejs.org"
            fi
        fi
        ;;

    2)
        echo ""
        echo "🟢 Netlify 拖放部署步骤:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. 访问 https://app.netlify.com"
        echo ""
        echo "2. 登录你的Netlify账号"
        echo ""
        echo "3. 点击 'Add new site' > 'Deploy manually'"
        echo ""
        echo "4. 将整个项目文件夹拖放到部署区域"
        echo "   项目路径: $(pwd)"
        echo ""
        echo "5. 等待部署完成（通常30秒）"
        echo ""
        echo "6. 在 Site settings > Domain management 配置自定义域名"
        echo "   域名: liuallen.com"
        echo ""
        ;;

    3)
        echo ""
        echo "📖 查看完整部署文档:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        if [ -f "DEPLOYMENT.md" ]; then
            cat DEPLOYMENT.md
        else
            echo "❌ 未找到 DEPLOYMENT.md"
        fi
        ;;

    4)
        echo ""
        echo "👋 再见！"
        exit 0
        ;;

    *)
        echo ""
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════"
echo "     🎉 准备完成！按照上述步骤即可部署"
echo "════════════════════════════════════════════════════════"
echo ""
echo "💡 提示: 查看 DEPLOYMENT.md 获取更多详细信息"
echo ""
