# GitHub 上传 - 超简单 3 步

## 你需要提供的信息

✅ **GitHub 用户名** - 例如：`johndoe`

就这一个！其他的脚本会帮你处理。

---

## 🚀 三步上传到 GitHub

### 第 1 步：在 GitHub 创建仓库

1. 访问：https://github.com/new
2. 填写：
   - Repository name: `nado-lighter-hedge`
   - 选择 **Private**（推荐私有）
   - **不要**勾选 "Initialize this repository with a README"
3. 点击 **Create repository**

**完成！** ✅

---

### 第 2 步：运行上传脚本

在项目文件夹中运行：

```bash
cd nado-lighter-hedge
./github-upload.sh
```

脚本会问你：
- **GitHub 用户名**: 输入你的用户名（如 `johndoe`）
- **仓库名**: 直接回车（使用默认的 `nado-lighter-hedge`）
- **仓库是否已创建**: 输入 `y`

**完成！** ✅

---

### 第 3 步：认证（如果需要）

如果推送时要求输入密码：

1. 访问：https://github.com/settings/tokens
2. 点击：**Generate new token (classic)**
3. 勾选：**repo** 权限
4. 点击：**Generate token**
5. **复制** token（注意：只显示一次）
6. 粘贴 token 作为密码

**完成！** ✅

---

## 🎉 上传成功后

脚本会显示你的**一键安装命令**：

```bash
curl -fsSL https://raw.githubusercontent.com/你的用户名/nado-lighter-hedge/main/install.sh | bash
```

把这个命令分享给需要安装的人（或自己在服务器上用）！

---

## 📋 完整命令速查

```bash
# 1. 进入项目目录
cd nado-lighter-hedge

# 2. 运行上传脚本
./github-upload.sh

# 输入你的 GitHub 用户名
# 其他选项直接回车使用默认值

# 3. 如果需要认证，使用 Personal Access Token
# 获取地址：https://github.com/settings/tokens
```

---

## ❓ 常见问题

### Q: 推送时提示 "authentication failed"？

**A**: 使用 Personal Access Token：
1. 访问 https://github.com/settings/tokens
2. 生成 token（勾选 repo）
3. 推送时用 token 作为密码

### Q: 脚本提示 "仓库不存在"？

**A**: 先在 GitHub 创建仓库（步骤 1）

### Q: 一键安装命令 404？

**A**: 等待几分钟让 GitHub 同步文件，或检查：
- 仓库是否设为 Public
- 文件是否已推送

### Q: 想修改仓库名？

**A**: 在脚本询问时输入新名称，或修改 GitHub 仓库设置

---

## 🎯 下一步

上传成功后：

1. ✅ 测试一键安装命令
2. ✅ 在 README 中添加安装说明
3. ✅ 设置仓库描述和主题
4. ✅ 创建 Release（可选）

详细说明：查看 `GITHUB_UPLOAD.md`

---

## 💡 提示

### 让仓库公开（如果需要）

私有仓库的一键安装需要认证。如果想让别人也能用：

1. 访问仓库 Settings
2. 滚动到底部 Danger Zone
3. Change repository visibility → Make public

### 更新代码

以后修改代码后：

```bash
git add .
git commit -m "描述你的修改"
git push
```

---

**就这么简单！** 🎉

有问题查看完整文档：`GITHUB_UPLOAD.md`
