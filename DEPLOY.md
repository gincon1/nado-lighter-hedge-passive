# Nado-Lighter 对冲机器人 - 部署到服务器

## 目录
1. [准备工作](#准备工作)
2. [上传到服务器](#上传到服务器)
3. [安装和配置](#安装和配置)
4. [启动运行](#启动运行)
5. [监控和维护](#监控和维护)

---

## 准备工作

### 本地准备

1. **下载项目文件夹** `nado-lighter-hedge`
2. **准备好以下信息**：
   - Nado 钱包私钥
   - Lighter 钱包私钥
   - Lighter 账户索引（后面会教你获取）

### 服务器要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **内存**: 至少 1GB RAM
- **硬盘**: 至少 5GB 可用空间
- **网络**: 稳定的网络连接

---

## 上传到服务器

### 方法 1: 使用 SCP（推荐）

在你的**本地电脑**上打开终端，运行：

```bash
# 替换以下内容：
# - /path/to/nado-lighter-hedge: 你的项目文件夹路径
# - username: 你的服务器用户名
# - your-server-ip: 你的服务器IP地址

scp -r /path/to/nado-lighter-hedge username@your-server-ip:/home/username/
```

**示例**：
```bash
scp -r ~/Downloads/nado-lighter-hedge root@123.456.789.0:/root/
```

### 方法 2: 使用 FileZilla（图形界面）

1. 下载安装 FileZilla: https://filezilla-project.org/
2. 连接到你的服务器：
   - Host: `sftp://your-server-ip`
   - Username: 你的用户名
   - Password: 你的密码
   - Port: 22
3. 拖拽 `nado-lighter-hedge` 文件夹到服务器

### 方法 3: 使用 WinSCP（Windows）

1. 下载安装 WinSCP: https://winscp.net/
2. 新建连接，填写服务器信息
3. 连接后，拖拽文件夹上传

---

## 安装和配置

### 1. 连接到服务器

```bash
ssh username@your-server-ip
```

**示例**：
```bash
ssh root@123.456.789.0
```

### 2. 进入项目目录

```bash
cd ~/nado-lighter-hedge
# 或
cd /root/nado-lighter-hedge
```

### 3. 运行自动安装脚本

```bash
./deploy.sh
```

这个脚本会自动：
- ✅ 检查 Node.js（如果没有会提示安装）
- ✅ 安装项目依赖
- ✅ 创建配置文件
- ✅ 安装 PM2（可选）

**如果脚本提示 Node.js 未安装**，先安装 Node.js：

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 4. 配置环境变量

编辑配置文件：

```bash
nano .env
```

填写以下内容（复制粘贴后修改）：

```env
# ========== Nado 配置 ==========
NADO_PRIVATE_KEY=0x你的Nado私钥
NADO_NETWORK=inkMainnet

# ========== Lighter 配置 ==========
LIGHTER_PRIVATE_KEY=0x你的Lighter私钥
LIGHTER_ACCOUNT_INDEX=0
LIGHTER_API_KEY_INDEX=0

# ========== 对冲配置 ==========
HEDGE_COIN=BTC
HEDGE_SIZE=0.002
HEDGE_SLIPPAGE=0.001
HEDGE_ORDER_TYPE=ioc

# ========== 循环配置 ==========
HEDGE_LOOP_COUNT=1
HEDGE_LOOP_HOLD_TIME=0
HEDGE_LOOP_INTERVAL=0
HEDGE_LOOP_STOP_ON_ERROR=false
```

**保存文件**：
- 按 `Ctrl + O`（保存）
- 按 `Enter`（确认）
- 按 `Ctrl + X`（退出）

### 5. 获取 Lighter 账户索引

在浏览器中打开（替换为你的钱包地址）：
```
https://mainnet.zklighter.elliot.ai/api/v1/account?by=l1_address&value=你的钱包地址
```

在返回的 JSON 中找到 `account_index`，例如：
```json
{
  "account_index": "12345",
  ...
}
```

把这个数字填入 `.env` 文件的 `LIGHTER_ACCOUNT_INDEX`：

```bash
nano .env
# 修改：LIGHTER_ACCOUNT_INDEX=12345
```

### 6. 测试配置

```bash
# 查看配置
node strategies/hedge_manager.js config

# 如果显示配置信息，说明配置正确
```

---

## 启动运行

### 第一次运行：小额测试

```bash
# 1. 查看 BTC 价差
node strategies/hedge_manager.js spread BTC

# 2. 小额开仓测试（0.001 BTC）
node strategies/hedge_manager.js open --coin BTC --size 0.001

# 3. 查看持仓
node strategies/hedge_manager.js status

# 4. 平仓
node strategies/hedge_manager.js close BTC
```

**如果测试成功**，继续下一步。

### 正式运行：使用 PM2

PM2 可以让程序在后台持续运行，即使你断开 SSH 连接。

#### 安装 PM2

```bash
npm install -g pm2
```

#### 启动循环对冲

```bash
# 启动：循环 1000 次，每次间隔 10 秒
pm2 start strategies/hedge_manager.js \
  --name nado-lighter-hedge \
  -- loop BTC -n 1000 -i 10
```

**参数说明**：
- `-n 1000`: 循环 1000 次
- `-i 10`: 每次间隔 10 秒
- `BTC`: 交易 BTC（也可以改成 ETH, SOL 等）

#### 查看运行状态

```bash
# 查看进程状态
pm2 status

# 查看实时日志
pm2 logs nado-lighter-hedge

# 只看最近 100 行
pm2 logs nado-lighter-hedge --lines 100
```

#### 停止/重启

```bash
# 停止
pm2 stop nado-lighter-hedge

# 重启
pm2 restart nado-lighter-hedge

# 删除
pm2 delete nado-lighter-hedge
```

#### 设置开机自启

```bash
# 保存当前配置
pm2 save

# 设置开机启动
pm2 startup

# 会显示一行命令，复制粘贴执行
# 例如：sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

---

## 监控和维护

### 每日检查（推荐）

```bash
# 1. 查看运行状态
pm2 status

# 2. 查看最近日志
pm2 logs nado-lighter-hedge --lines 50

# 3. 查看持仓
node strategies/hedge_manager.js status

# 4. 查看价差
node strategies/hedge_manager.js spread BTC
```

### 查看日志

```bash
# 实时查看
pm2 logs nado-lighter-hedge

# 只看错误
pm2 logs nado-lighter-hedge --err

# 清空日志
pm2 flush
```

### 监控界面

```bash
# 打开监控界面
pm2 monit

# 显示CPU、内存使用情况和实时日志
# 按 q 退出
```

### 修改配置

如果要修改交易参数：

```bash
# 1. 停止机器人
pm2 stop nado-lighter-hedge

# 2. 修改配置
nano .env

# 3. 重启
pm2 restart nado-lighter-hedge
```

### 更新策略

如果要改变循环次数或间隔：

```bash
# 1. 删除旧进程
pm2 delete nado-lighter-hedge

# 2. 启动新配置
pm2 start strategies/hedge_manager.js \
  --name nado-lighter-hedge \
  -- loop BTC -n 2000 -i 5  # 改成 2000 次，每 5 秒
```

---

## 常见问题

### Q1: 订单失败怎么办？

**答**: 
1. 检查账户余额是否充足
2. 查看日志：`pm2 logs nado-lighter-hedge --err`
3. 确认配置正确：`node strategies/hedge_manager.js config`

### Q2: 持仓不平衡怎么办？

**答**:
1. 查看持仓：`node strategies/hedge_manager.js status`
2. 计算差额
3. 手动在两个交易所调整持仓

### Q3: 进程自动停止了？

**答**:
1. 查看日志找原因：`pm2 logs nado-lighter-hedge --lines 200`
2. 检查是否循环次数用完了（-n 参数）
3. 检查服务器资源是否充足：`free -h` 和 `df -h`

### Q4: 如何完全停止机器人？

**答**:
```bash
# 停止
pm2 stop nado-lighter-hedge

# 删除（彻底）
pm2 delete nado-lighter-hedge

# 平掉所有持仓
node strategies/hedge_manager.js close BTC
```

### Q5: 如何备份配置？

**答**:
```bash
# 下载 .env 文件到本地
scp username@your-server-ip:/path/to/nado-lighter-hedge/.env ~/backup-env.txt
```

---

## 紧急情况处理

### 如果服务器崩溃

1. **立即手动平仓**：
   - 登录 Nado 交易所，手动平掉所有持仓
   - 登录 Lighter 交易所，手动平掉所有持仓

2. **重启机器人**：
   ```bash
   ssh username@your-server-ip
   cd ~/nado-lighter-hedge
   pm2 restart nado-lighter-hedge
   ```

### 如果价格异常

1. **立即停止**：
   ```bash
   pm2 stop nado-lighter-hedge
   ```

2. **检查价差**：
   ```bash
   node strategies/hedge_manager.js spread BTC
   ```

3. **如果价差正常，重启**：
   ```bash
   pm2 restart nado-lighter-hedge
   ```

---

## 安全建议

1. ✅ **定期备份 .env 文件**（保存到安全的地方）
2. ✅ **不要分享私钥**
3. ✅ **使用强密码保护服务器**
4. ✅ **定期更新系统**：`sudo apt update && sudo apt upgrade`
5. ✅ **监控服务器资源**
6. ✅ **设置合理的交易金额**

---

## 联系支持

如果遇到问题：

1. 查看完整文档：[README.md](README.md)
2. 查看快速指南：[QUICKSTART.md](QUICKSTART.md)
3. 检查日志文件
4. 查阅 Nado 和 Lighter 官方文档

---

**祝部署顺利！** 🚀

有问题随时查看文档或重新运行 `./deploy.sh` 脚本。
