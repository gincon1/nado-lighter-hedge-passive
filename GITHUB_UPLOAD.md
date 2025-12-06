# GitHub 上传指南

## 📋 上传步骤

按照以下步骤将项目上传到 GitHub，并配置一键安装命令。

---

## 步骤 1: 创建 GitHub 仓库

### 方法 A: 在 GitHub 网站创建

1. **登录 GitHub**
   - 访问 https://github.com
   - 登录你的账户

2. **创建新仓库**
   - 点击右上角的 `+` → `New repository`
   - 或访问 https://github.com/new

3. **填写仓库信息**
   - **Repository name**: `nado-lighter-hedge`（或其他名称）
   - **Description**: `Nado-Lighter hedge trading bot`
   - **Public/Private**: 建议选择 Private（私有）
   - **不要**勾选 "Initialize this repository with a README"
   - 点击 `Create repository`

4. **记录仓库 URL**
   - 创建后会显示仓库 URL，例如：
     ```
     https://github.com/your-username/nado-lighter-hedge.git
     ```
   - 记下这个 URL，稍后会用到

### 方法 B: 使用 GitHub CLI（可选）

```bash
# 安装 GitHub CLI
# Ubuntu/Debian:
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# 登录
gh auth login

# 创建仓库
gh repo create nado-lighter-hedge --private --source=. --remote=origin
```

---

## 步骤 2: 准备项目文件

### 2.1 解压项目（如果是 .tar.gz）

```bash
tar -xzf nado-lighter-hedge.tar.gz
cd nado-lighter-hedge
```

### 2.2 初始化 Git 仓库

```bash
# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Nado-Lighter hedge trading bot"
```

---

## 步骤 3: 上传到 GitHub

### 3.1 添加远程仓库

```bash
# 替换 YOUR_USERNAME 为你的 GitHub 用户名
# 替换 nado-lighter-hedge 为你的仓库名（如果不同）
git remote add origin https://github.com/YOUR_USERNAME/nado-lighter-hedge.git
```

**示例**：
```bash
git remote add origin https://github.com/johndoe/nado-lighter-hedge.git
```

### 3.2 推送代码

```bash
# 推送到 main 分支
git branch -M main
git push -u origin main
```

**如果遇到认证问题**：

**方法 1: 使用 Personal Access Token（推荐）**

1. 访问 https://github.com/settings/tokens
2. 点击 `Generate new token (classic)`
3. 勾选 `repo` 权限
4. 生成并复制 token
5. 推送时使用 token 作为密码

**方法 2: 使用 SSH**

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 访问 https://github.com/settings/keys 添加 SSH key

# 修改远程地址为 SSH
git remote set-url origin git@github.com:YOUR_USERNAME/nado-lighter-hedge.git

# 推送
git push -u origin main
```

---

## 步骤 4: 配置一键安装命令

### 4.1 更新 install.sh 中的仓库地址

编辑 `install.sh` 文件：

```bash
nano install.sh
```

找到这一行：
```bash
REPO_URL="https://github.com/YOUR_USERNAME/nado-lighter-hedge.git"
```

替换为你的实际仓库地址，例如：
```bash
REPO_URL="https://github.com/johndoe/nado-lighter-hedge.git"
```

保存文件：
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

### 4.2 提交修改

```bash
git add install.sh
git commit -m "Update repository URL in install.sh"
git push
```

### 4.3 测试一键安装命令

在另一台机器或新目录测试：

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/nado-lighter-hedge/main/install.sh | bash
```

**示例**：
```bash
curl -fsSL https://raw.githubusercontent.com/johndoe/nado-lighter-hedge/main/install.sh | bash
```

---

## 步骤 5: 更新 README.md

### 5.1 添加一键安装说明

编辑 `README.md`，在开头添加：

```markdown
## 🚀 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/nado-lighter-hedge/main/install.sh | bash
```

或使用 wget：

```bash
wget -qO- https://raw.githubusercontent.com/YOUR_USERNAME/nado-lighter-hedge/main/install.sh | bash
```
```

### 5.2 提交修改

```bash
git add README.md
git commit -m "Add one-click installation instructions"
git push
```

---

## 步骤 6: 创建 Release（可选但推荐）

### 6.1 在 GitHub 网站创建 Release

1. 访问你的仓库页面
2. 点击右侧的 `Releases`
3. 点击 `Create a new release`
4. 填写信息：
   - **Tag version**: `v1.0.0`
   - **Release title**: `v1.0.0 - Initial Release`
   - **Description**: 
     ```markdown
     # Nado-Lighter 对冲机器人 v1.0.0
     
     ## 🎉 首次发布
     
     ### 功能特性
     - ✅ Nado + Lighter 双边对冲
     - ✅ 自动价差监控
     - ✅ 循环对冲（刷量）
     - ✅ 完整的 CLI 管理工具
     - ✅ PM2 进程管理支持
     
     ### 一键安装
     ```bash
     curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/nado-lighter-hedge/main/install.sh | bash
     ```
     
     ### 文档
     - [README.md](README.md)
     - [快速指南](QUICKSTART.md)
     - [部署教程](DEPLOY.md)
     ```
5. 点击 `Publish release`

### 6.2 使用 GitHub CLI 创建（可选）

```bash
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes "First release of Nado-Lighter hedge bot"
```

---

## 步骤 7: 设置仓库描述和主题

### 7.1 添加仓库描述

1. 访问仓库页面
2. 点击右侧 `About` 旁边的齿轮图标
3. 填写：
   - **Description**: `Nado-Lighter hedge trading bot for DeFi perpetual contracts`
   - **Website**: 如果有的话
   - **Topics**: 添加标签
     ```
     defi
     trading-bot
     hedge
     nado
     lighter
     cryptocurrency
     nodejs
     ```
4. 保存

---

## 步骤 8: 完善 README（可选）

### 添加徽章（Badges）

在 README.md 开头添加：

```markdown
# Nado-Lighter 对冲机器人

![GitHub release](https://img.shields.io/github/v/release/YOUR_USERNAME/nado-lighter-hedge)
![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/nado-lighter-hedge)
![GitHub license](https://img.shields.io/github/license/YOUR_USERNAME/nado-lighter-hedge)
![Node version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)

在 Nado 和 Lighter 两个去中心化永续合约交易所之间执行对冲交易的自动化工具。

## 🚀 一键安装
...
```

---

## 完整的上传命令速查

```bash
# 1. 初始化 Git
cd nado-lighter-hedge
git init

# 2. 添加文件
git add .

# 3. 提交
git commit -m "Initial commit"

# 4. 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/nado-lighter-hedge.git

# 5. 推送
git branch -M main
git push -u origin main

# 6. 修改 install.sh 中的仓库地址
nano install.sh
# 找到并修改: REPO_URL="https://github.com/YOUR_USERNAME/nado-lighter-hedge.git"

# 7. 提交修改
git add install.sh
git commit -m "Update repository URL"
git push
```

---

## 一键安装命令（最终版）

完成所有步骤后，用户可以使用以下命令安装：

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/nado-lighter-hedge/main/install.sh | bash
```

**记得替换 `YOUR_USERNAME` 为你的实际 GitHub 用户名！**

---

## 测试安装

在干净的环境测试：

```bash
# 方法 1: 在新服务器测试
ssh test-server
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/nado-lighter-hedge/main/install.sh | bash

# 方法 2: 在本地新目录测试
cd /tmp
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/nado-lighter-hedge/main/install.sh | bash
```

---

## 常见问题

### Q: 推送时提示认证失败？

**A**: 使用 Personal Access Token：
1. 访问 https://github.com/settings/tokens
2. 生成 token（勾选 repo 权限）
3. 推送时用 token 作为密码

### Q: install.sh 下载 404 错误？

**A**: 检查：
1. 仓库地址是否正确
2. 文件是否已推送到 GitHub
3. 仓库是否设为 Public（私有仓库需要认证）

### Q: 如何设置仓库为私有？

**A**: 
1. 访问仓库 Settings
2. 滚动到底部 Danger Zone
3. 点击 Change repository visibility
4. 选择 Make private

**注意**: 私有仓库的一键安装命令需要认证，不推荐。

---

## 后续维护

### 更新代码

```bash
# 修改代码后
git add .
git commit -m "描述你的修改"
git push
```

### 创建新版本

```bash
# 更新版本号
git tag v1.1.0
git push --tags

# 在 GitHub 创建 Release
```

### 保持同步

```bash
# 拉取最新代码
git pull origin main
```

---

## 下一步

完成上传后：

1. ✅ 分享你的一键安装命令
2. ✅ 在 README 中添加安装说明
3. ✅ 测试一键安装是否正常
4. ✅ 开始使用和推广

---

**祝上传顺利！** 🚀

如有问题，请查看 GitHub 官方文档：https://docs.github.com/
