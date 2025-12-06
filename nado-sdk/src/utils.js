/**
 * Nado SDK 工具函数
 * 参考 Hyperliquid SDK 的实现
 */

/**
 * 将浮点数转换为字符串用于哈希
 * 移除尾随零并处理科学计数法
 *
 * @param {number} x - 要转换的数字
 * @returns {string} 格式化的字符串
 */
function floatToStringForHashing(x) {
  if (x === 0) {
    return '0';
  }

  // 转换为字符串并移除科学计数法
  let s = x.toString();

  // 处理科学计数法
  if (s.includes('e')) {
    const parts = s.split('e');
    const coefficient = parseFloat(parts[0]);
    const exponent = parseInt(parts[1]);

    if (exponent < 0) {
      // 处理小数
      const decimals = Math.abs(exponent) + (coefficient.toString().split('.')[1]?.length || 0);
      s = coefficient.toFixed(decimals);
    } else {
      // 处理大数
      s = (coefficient * Math.pow(10, exponent)).toString();
    }
  }

  // 移除尾随零
  if (s.includes('.')) {
    s = s.replace(/\.?0+$/, '');
  }

  return s;
}

/**
 * 格式化价格为指定精度
 * @param {number|string} price - 价格
 * @param {number} decimals - 小数位数，默认 2
 * @returns {string}
 */
function formatPrice(price, decimals = 2) {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toFixed(decimals);
}

/**
 * 格式化数量
 * @param {number|string} size - 数量
 * @param {number} decimals - 小数位数，默认 4
 * @returns {string}
 */
function formatSize(size, decimals = 4) {
  const num = typeof size === 'string' ? parseFloat(size) : size;
  return num.toFixed(decimals);
}

/**
 * 计算价差百分比
 * @param {number} price1 - 价格1
 * @param {number} price2 - 价格2
 * @returns {number} 价差百分比
 */
function calculateSpreadPercent(price1, price2) {
  const diff = Math.abs(price1 - price2);
  const avg = (price1 + price2) / 2;
  return (diff / avg) * 100;
}

/**
 * 验证私钥格式
 * @param {string} privateKey - 私钥
 * @returns {boolean}
 */
function isValidPrivateKey(privateKey) {
  if (!privateKey || typeof privateKey !== 'string') {
    return false;
  }

  // 移除 0x 前缀
  const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // 检查长度和格式
  return /^[0-9a-fA-F]{64}$/.test(key);
}

/**
 * 确保私钥有 0x 前缀
 * @param {string} privateKey - 私钥
 * @returns {string}
 */
function ensureHexPrefix(privateKey) {
  return privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
}

/**
 * 延迟函数
 * @param {number} ms - 毫秒数
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 * @param {Function} fn - 要执行的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delayMs - 重试间隔（毫秒）
 * @returns {Promise}
 */
async function retry(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        console.log(`重试 ${i + 1}/${maxRetries}...`);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

module.exports = {
  floatToStringForHashing,
  formatPrice,
  formatSize,
  calculateSpreadPercent,
  isValidPrivateKey,
  ensureHexPrefix,
  delay,
  retry,
};
