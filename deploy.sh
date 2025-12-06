#!/bin/bash

echo "================================================"
echo "    Nado-Lighter 对冲机器人 - 快速部署脚本"
echo "================================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✓ npm 版本: $(npm -v)"
echo ""

# 安装依赖
echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✓ 依赖安装成功"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件"
    echo "正在复制 .env.example..."
    cp .env.example .env
    echo "✓ 已创建 .env 文件"
    echo ""
    echo "⚠️  请编辑 .env 文件并填写以下配置:"
    echo "   - NADO_PRIVATE_KEY"
    echo "   - LIGHTER_PRIVATE_KEY"
    echo "   - LIGHTER_ACCOUNT_INDEX"
    echo ""
    echo "编辑命令: nano .env"
    echo ""
    read -p "是否现在编辑 .env 文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    else
        echo "请稍后手动编辑 .env 文件"
        exit 0
    fi
fi

echo "✓ .env 文件存在"
echo ""

# 测试配置
echo "🧪 测试配置..."
node strategies/hedge_manager.js config

if [ $? -ne 0 ]; then
    echo "❌ 配置测试失败"
    echo "请检查 .env 文件中的配置"
    exit 1
fi

echo ""
echo "✓ 配置测试通过"
echo ""

# 询问是否安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  未找到 PM2"
    read -p "是否安装 PM2 进程管理器? (推荐) (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 安装 PM2..."
        npm install -g pm2
        if [ $? -ne 0 ]; then
            echo "❌ PM2 安装失败"
            echo "请手动安装: sudo npm install -g pm2"
        else
            echo "✓ PM2 安装成功"
        fi
    fi
fi

echo ""
echo "================================================"
echo "         ✅ 部署完成！"
echo "================================================"
echo ""
echo "📖 使用指南:"
echo ""
echo "1. 查看配置:"
echo "   node strategies/hedge_manager.js config"
echo ""
echo "2. 查看价差:"
echo "   node strategies/hedge_manager.js spread BTC"
echo ""
echo "3. 开仓测试:"
echo "   node strategies/hedge_manager.js open --size 0.001"
echo ""
echo "4. 循环对冲:"
echo "   node strategies/hedge_manager.js loop BTC -n 10 -i 5"
echo ""
echo "5. 使用 PM2 运行 (后台运行):"
echo "   pm2 start strategies/hedge_manager.js --name hedge -- loop BTC -n 1000 -i 10"
echo "   pm2 logs hedge"
echo "   pm2 stop hedge"
echo ""
echo "⚠️  风险提示:"
echo "   - 先用小金额测试"
echo "   - 确保两边账户有充足保证金"
echo "   - 定期监控持仓和日志"
echo ""
echo "📚 详细文档: README.md"
echo ""
