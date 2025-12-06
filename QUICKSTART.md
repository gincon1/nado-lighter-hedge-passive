# Nado-Lighter 对冲机器人 - 快速启动指南

## 📋 准备工作

在开始之前，确保你有：

1. ✅ Nado 账户和私钥
2. ✅ Lighter 账户和私钥
3. ✅ 两个账户都有充足的资金（用于保证金）
4. ✅ Node.js v14+ 已安装
5. ✅ 服务器或本地机器（用于运行机器人）

## 🚀 5分钟快速部署

### 步骤 1: 上传项目到服务器

```bash
# 使用 scp 上传（从本地执行）
scp -r nado-lighter-hedge user@your-server:/path/to/

# 或使用 rsync
rsync -avz nado-lighter-hedge user@your-server:/path/to/

# 或使用 Git
git clone <repository-url>
```

### 步骤 2: SSH 连接到服务器

```bash
ssh user@your-server
cd /path/to/nado-lighter-hedge
```

### 步骤 3: 运行自动部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动：
- ✅ 检查 Node.js 环境
- ✅ 安装项目依赖
- ✅ 创建 .env 配置文件
- ✅ 测试配置
- ✅ 可选安装 PM2

### 步骤 4: 配置环境变量

编辑 `.env` 文件：

```bash
nano .env
```

必填配置：

```env
# Nado 配置
NADO_PRIVATE_KEY=0xYOUR_NADO_PRIVATE_KEY
NADO_NETWORK=inkMainnet

# Lighter 配置
LIGHTER_PRIVATE_KEY=0xYOUR_LIGHTER_PRIVATE_KEY
LIGHTER_ACCOUNT_INDEX=0  # 从 Lighter API 获取
LIGHTER_API_KEY_INDEX=0

# 对冲配置（可选）
HEDGE_COIN=BTC
HEDGE_SIZE=0.002
HEDGE_SLIPPAGE=0.001
```

**获取 Lighter 账户索引：**

访问: `https://mainnet.zklighter.elliot.ai/api/v1/account?by=l1_address&value=YOUR_WALLET_ADDRESS`

找到返回 JSON 中的 `account_index` 字段。

### 步骤 5: 测试运行

```bash
# 查看配置
node strategies/hedge_manager.js config

# 查看 BTC 价差
node strategies/hedge_manager.js spread BTC

# 查看持仓
node strategies/hedge_manager.js status
```

### 步骤 6: 小额测试

```bash
# 开仓测试（小金额）
node strategies/hedge_manager.js open --size 0.001 --coin BTC

# 查看持仓
node strategies/hedge_manager.js status

# 平仓
node strategies/hedge_manager.js close BTC
```

### 步骤 7: 启动循环对冲

#### 方式 A: 使用 PM2（推荐）

```bash
# 启动循环对冲（1000次，每次间隔10秒）
pm2 start strategies/hedge_manager.js \
  --name nado-lighter-hedge \
  -- loop BTC -n 1000 -i 10

# 查看日志
pm2 logs nado-lighter-hedge

# 查看状态
pm2 status

# 监控
pm2 monit
```

#### 方式 B: 使用 screen

```bash
# 创建 screen 会话
screen -S hedge

# 运行循环
node strategies/hedge_manager.js loop BTC -n 1000 -i 10

# 分离会话: Ctrl+A+D
# 重新连接: screen -r hedge
```

## 📊 常用命令

### 查看信息

```bash
# 查看配置
node strategies/hedge_manager.js config

# 查看价差
node strategies/hedge_manager.js spread BTC
node strategies/hedge_manager.js spread ETH

# 查看持仓
node strategies/hedge_manager.js status

# 列出支持的币种
node strategies/hedge_manager.js list
```

### 交易操作

```bash
# 开仓
node strategies/hedge_manager.js open --coin BTC --size 0.002

# 平仓
node strategies/hedge_manager.js close BTC

# 往返对冲
node strategies/hedge_manager.js roundtrip BTC --size 0.002

# 循环对冲
node strategies/hedge_manager.js loop BTC -n 10 -i 5

# 持仓后自动平仓
node strategies/hedge_manager.js loop BTC -n 10 --hold-time 30 -i 5
```

### PM2 管理

```bash
# 启动
pm2 start strategies/hedge_manager.js --name hedge -- loop BTC -n 1000 -i 10

# 停止
pm2 stop hedge

# 重启
pm2 restart hedge

# 删除
pm2 delete hedge

# 查看日志
pm2 logs hedge

# 实时监控
pm2 monit

# 保存配置
pm2 save

# 开机自启
pm2 startup
```

## 🎯 推荐配置

### 保守型（低风险，低频率）

```bash
# 每次 0.001 BTC，每30秒一次，循环100次
node strategies/hedge_manager.js loop BTC \
  --size 0.001 \
  --count 100 \
  --interval 30 \
  --stop-on-error
```

### 标准型（中等风险，中等频率）

```bash
# 每次 0.002 BTC，每10秒一次，循环500次
node strategies/hedge_manager.js loop BTC \
  --size 0.002 \
  --count 500 \
  --interval 10
```

### 激进型（高风险，高频率）

```bash
# 每次 0.005 BTC，每5秒一次，循环1000次
node strategies/hedge_manager.js loop BTC \
  --size 0.005 \
  --count 1000 \
  --interval 5
```

## 🔍 监控和维护

### 日志监控

```bash
# PM2 实时日志
pm2 logs nado-lighter-hedge --lines 100

# 只看错误
pm2 logs nado-lighter-hedge --err

# 清空日志
pm2 flush
```

### 健康检查

定期运行（建议每小时）：

```bash
# 检查持仓
node strategies/hedge_manager.js status

# 检查价差
node strategies/hedge_manager.js spread BTC
```

### 持仓平衡

如果持仓不平衡：

```bash
# 1. 查看持仓
node strategies/hedge_manager.js status

# 2. 手动调整
# 如果 Nado 多了，卖出 Nado / 买入 Lighter
# 如果 Lighter 多了，买入 Nado / 卖出 Lighter
```

## ⚠️ 重要提示

### 风险控制

1. **从小金额开始**: 先用 0.001 测试
2. **监控价差**: 确保有利润空间（至少 0.05%）
3. **充足保证金**: 两边账户保持 2-3 倍保证金
4. **设置限制**: 使用 --count 限制循环次数
5. **错误停止**: 使用 --stop-on-error 避免连续失败

### 保证金管理

最小保证金要求（以 BTC 为例）：

- 对冲 0.001 BTC: 约需 $100 保证金（两边各 $50）
- 对冲 0.002 BTC: 约需 $200 保证金（两边各 $100）
- 对冲 0.005 BTC: 约需 $500 保证金（两边各 $250）

**建议保持 3 倍保证金以应对波动。**

### 紧急情况

如果出现问题：

```bash
# 1. 立即停止机器人
pm2 stop nado-lighter-hedge

# 2. 查看持仓
node strategies/hedge_manager.js status

# 3. 手动平仓（如果需要）
# 分别在 Nado 和 Lighter 上手动平仓

# 4. 查看日志找出原因
pm2 logs nado-lighter-hedge --lines 200
```

## 📈 性能优化

### 减少延迟

1. **使用高性能服务器**: 建议使用 VPS（如 AWS, Google Cloud）
2. **选择合适区域**: 选择靠近交易所的服务器区域
3. **优化网络**: 使用稳定的网络连接
4. **减少间隔**: 根据市场情况调整 --interval

### 提高成交率

1. **增加滑点**: 提高 HEDGE_SLIPPAGE（如 0.002 或 0.003）
2. **使用市价单**: 设置 HEDGE_ORDER_TYPE=market（Lighter支持）
3. **监控订单簿**: 选择流动性好的时段交易

## 🆘 故障排查

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 订单失败 | 余额不足 | 充值保证金 |
| 价格获取失败 | 网络问题 | 检查网络连接 |
| 持仓不平衡 | 部分成交 | 手动调整持仓 |
| 进程崩溃 | 配置错误 | 检查 .env 配置 |

### 调试模式

```bash
# 启用详细日志
NODE_DEBUG=* node strategies/hedge_manager.js spread BTC

# 测试配置
node strategies/hedge_manager.js config
```

## 📞 支持

遇到问题？

1. 查看 [README.md](README.md) 完整文档
2. 检查日志：`pm2 logs nado-lighter-hedge`
3. 查阅 Nado 和 Lighter 官方文档

---

**祝交易顺利！ 🚀**
