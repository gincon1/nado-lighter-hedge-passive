#!/bin/bash

# GitHub 快速上传脚本
# 帮助用户快速上传项目到 GitHub

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║           GitHub 快速上传助手                               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git 未安装${NC}"
    echo "请先安装 Git: sudo apt install git"
    exit 1
fi

echo -e "${GREEN}✓ Git 已安装: $(git --version)${NC}"
echo ""

# 检查是否在项目目录
if [ ! -f "package.json" ] || [ ! -f "README.md" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 询问 GitHub 用户名
echo -e "${BLUE}📝 请输入你的 GitHub 信息${NC}"
echo ""
read -p "GitHub 用户名: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo -e "${RED}❌ 用户名不能为空${NC}"
    exit 1
fi

# 询问仓库名
DEFAULT_REPO="nado-lighter-hedge"
read -p "仓库名 (默认: $DEFAULT_REPO): " REPO_NAME
REPO_NAME=${REPO_NAME:-$DEFAULT_REPO}

# 构建仓库 URL
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
RAW_URL="https://raw.githubusercontent.com/$GITHUB_USERNAME/$REPO_NAME/main/install.sh"

echo ""
echo -e "${GREEN}✓ 仓库地址: $REPO_URL${NC}"
echo ""

# 检查仓库是否已创建
echo "⏳ 检查仓库是否存在..."
if git ls-remote "$REPO_URL" &> /dev/null; then
    echo -e "${YELLOW}⚠️  仓库已存在${NC}"
    read -p "是否继续推送? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    REPO_EXISTS=true
else
    echo -e "${YELLOW}⚠️  仓库不存在${NC}"
    echo ""
    echo "请先在 GitHub 创建仓库:"
    echo "1. 访问: https://github.com/new"
    echo "2. Repository name: $REPO_NAME"
    echo "3. 选择 Private（推荐）"
    echo "4. 不要勾选 'Initialize this repository with a README'"
    echo "5. 点击 'Create repository'"
    echo ""
    read -p "仓库已创建? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消"
        exit 0
    fi
    REPO_EXISTS=false
fi

# 更新 install.sh 中的仓库地址
echo ""
echo "📝 更新 install.sh..."
if [ -f "install.sh" ]; then
    sed -i.bak "s|REPO_URL=\".*\"|REPO_URL=\"$REPO_URL\"|g" install.sh
    echo -e "${GREEN}✓ install.sh 已更新${NC}"
else
    echo -e "${YELLOW}⚠️  install.sh 不存在${NC}"
fi

# 初始化 Git（如果需要）
if [ ! -d ".git" ]; then
    echo ""
    echo "🔧 初始化 Git 仓库..."
    git init
    git branch -M main
    echo -e "${GREEN}✓ Git 仓库已初始化${NC}"
fi

# 添加远程仓库（如果需要）
if ! git remote get-url origin &> /dev/null; then
    echo ""
    echo "🔗 添加远程仓库..."
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✓ 远程仓库已添加${NC}"
else
    # 更新远程仓库地址
    git remote set-url origin "$REPO_URL"
    echo -e "${GREEN}✓ 远程仓库已更新${NC}"
fi

# 添加所有文件
echo ""
echo "📦 添加文件..."
git add .
echo -e "${GREEN}✓ 文件已添加${NC}"

# 提交
echo ""
read -p "提交信息 (默认: 'Update project'): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-"Update project"}

git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✓ 已提交${NC}"

# 推送
echo ""
echo "🚀 推送到 GitHub..."
echo ""
echo -e "${YELLOW}提示: 如果需要认证，请使用 Personal Access Token${NC}"
echo "获取 Token: https://github.com/settings/tokens"
echo ""

if git push -u origin main; then
    echo ""
    echo -e "${GREEN}✓ 推送成功！${NC}"
    
    # 显示一键安装命令
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    ✅ 上传完成！                           ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎉 你的项目已上传到 GitHub！"
    echo ""
    echo "📍 仓库地址:"
    echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "🚀 一键安装命令:"
    echo ""
    echo "   curl -fsSL $RAW_URL | bash"
    echo ""
    echo "或:"
    echo ""
    echo "   wget -qO- $RAW_URL | bash"
    echo ""
    echo "📝 下一步:"
    echo "   1. 访问仓库页面设置描述和主题"
    echo "   2. 在 README.md 中添加一键安装说明"
    echo "   3. 创建 Release (可选)"
    echo "   4. 测试一键安装命令"
    echo ""
    echo "📚 详细文档:"
    echo "   cat GITHUB_UPLOAD.md"
    echo ""
else
    echo ""
    echo -e "${RED}❌ 推送失败${NC}"
    echo ""
    echo "可能的原因:"
    echo "1. 认证失败 - 使用 Personal Access Token"
    echo "2. 仓库不存在 - 先在 GitHub 创建"
    echo "3. 网络问题 - 检查网络连接"
    echo ""
    echo "详细帮助: cat GITHUB_UPLOAD.md"
    exit 1
fi

# 询问是否测试安装命令
echo ""
read -p "是否在新目录测试安装命令? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    TEST_DIR="/tmp/nado-lighter-hedge-test-$(date +%s)"
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR"
    
    echo ""
    echo "🧪 测试安装..."
    echo "下载命令: curl -fsSL $RAW_URL | bash"
    echo ""
    
    # 等待 GitHub 同步
    echo "⏳ 等待 GitHub 同步 (5秒)..."
    sleep 5
    
    if curl -fsSL "$RAW_URL" | bash; then
        echo ""
        echo -e "${GREEN}✓ 安装测试成功！${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  安装测试失败${NC}"
        echo "可能需要等待几分钟让 GitHub 同步文件"
    fi
    
    # 清理
    cd -
    rm -rf "$TEST_DIR"
fi

echo ""
echo "🎉 全部完成！"
echo ""
