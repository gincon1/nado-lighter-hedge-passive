/**
 * Nado SDK 订单工具函数
 * 包含 nonce 生成、appendix 打包、价格转换等
 */

const BigNumber = require('bignumber.js');

// Nado 使用 18 位小数
const NADO_DECIMALS = 18;

// 默认 recvTime 偏移量 (90 秒)
const DEFAULT_RECV_TIME_OFFSET_MS = 90 * 1000;

/**
 * 获取默认 recvTime (当前时间 + 90 秒)
 * @returns {number} 毫秒时间戳
 */
function getDefaultRecvTime() {
  return Date.now() + DEFAULT_RECV_TIME_OFFSET_MS;
}

/**
 * 生成订单 nonce
 * nonce = (recvTimeMillis << 20) + randomInt
 * @param {number} recvTimeMillis - 接收时间毫秒，默认当前时间 + 90s
 * @param {number} randomInt - 随机数，默认 0-999
 * @returns {string} nonce 字符串
 */
function getOrderNonce(recvTimeMillis = getDefaultRecvTime(), randomInt = Math.floor(Math.random() * 1000)) {
  const nonce = (BigInt(recvTimeMillis) << 20n) + BigInt(randomInt);
  return nonce.toString();
}

/**
 * 从 nonce 中提取 recvTime
 * @param {string} orderNonce - 订单 nonce
 * @returns {number} recvTime 毫秒
 */
function getRecvTimeFromOrderNonce(orderNonce) {
  const bigIntRecvTime = BigInt(orderNonce) >> 20n;
  return Number(bigIntRecvTime.toString());
}

/**
 * 添加小数位 (乘以 10^decimals)
 * @param {number|string|BigNumber} value - 原始值
 * @param {number} decimals - 小数位，默认 18
 * @returns {BigNumber}
 */
function addDecimals(value, decimals = NADO_DECIMALS) {
  return new BigNumber(value).multipliedBy(new BigNumber(10).pow(decimals));
}

/**
 * 移除小数位 (除以 10^decimals)
 * @param {number|string|BigNumber} value - 原始值
 * @param {number} decimals - 小数位，默认 18
 * @returns {BigNumber}
 */
function removeDecimals(value, decimals = NADO_DECIMALS) {
  return new BigNumber(value).dividedBy(new BigNumber(10).pow(decimals));
}

/**
 * 将值转换为整数字符串 (用于 EIP-712 签名)
 * @param {number|string|BigNumber|bigint} value
 * @returns {string}
 */
function toIntegerString(value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return new BigNumber(value).toFixed(0);
}

/**
 * 将值转换为 BigInt (用于 EIP-712 签名)
 * @param {number|string|BigNumber} value
 * @returns {bigint}
 */
function toBigInt(value) {
  return BigInt(toIntegerString(value));
}

/**
 * 位掩码值
 * @param {bigint|number} value - 值
 * @param {number} bits - 位数
 * @returns {bigint}
 */
function bitMaskValue(value, bits) {
  const mask = (1n << BigInt(bits)) - 1n;
  return BigInt(value) & mask;
}

/**
 * Order Appendix 打包
 *
 * 位布局 (MSB → LSB):
 * | value(64) | reserved(50) | trigger(2) | reduceOnly(1) | orderType(2) | isolated(1) | version(8) |
 *
 * @param {Object} options - 订单选项
 * @param {string} options.orderExecutionType - 订单执行类型: 'default' | 'ioc' | 'fok' | 'post_only'
 * @param {boolean} options.reduceOnly - 是否只减仓
 * @param {boolean} options.isolated - 是否隔离保证金
 * @param {string} options.triggerType - 触发类型: null | 'price' | 'twap' | 'twap_custom_amounts'
 * @returns {bigint}
 */
function packOrderAppendix(options = {}) {
  const {
    orderExecutionType = 'default',
    reduceOnly = false,
    isolated = false,
    triggerType = null,
  } = options;

  // orderType: 0=default, 1=ioc, 2=fok, 3=post_only
  const orderType = (() => {
    switch (orderExecutionType) {
      case 'default': return 0;
      case 'ioc': return 1;
      case 'fok': return 2;
      case 'post_only': return 3;
      default: return 0;
    }
  })();

  // trigger: 0=none, 1=price, 2=twap, 3=twap_custom_amounts
  const trigger = (() => {
    switch (triggerType) {
      case 'price': return 1;
      case 'twap': return 2;
      case 'twap_custom_amounts': return 3;
      default: return 0;
    }
  })();

  const bits = {
    value: 0n,           // 64 bits
    reserved: 0,         // 50 bits
    trigger,             // 2 bits
    reduceOnly: reduceOnly ? 1 : 0,  // 1 bit
    orderType,           // 2 bits
    isolated: isolated ? 1 : 0,      // 1 bit
    version: 1,          // 8 bits
  };

  // 打包
  let packed = bitMaskValue(bits.value, 64);
  packed = (packed << 50n) | bitMaskValue(bits.reserved, 50);
  packed = (packed << 2n) | bitMaskValue(bits.trigger, 2);
  packed = (packed << 1n) | bitMaskValue(bits.reduceOnly, 1);
  packed = (packed << 2n) | bitMaskValue(bits.orderType, 2);
  packed = (packed << 1n) | bitMaskValue(bits.isolated, 1);
  packed = (packed << 8n) | bitMaskValue(bits.version, 8);

  return packed;
}

/**
 * 解包 Order Appendix
 * @param {bigint|string} appendix
 * @returns {Object}
 */
function unpackOrderAppendix(appendix) {
  const packed = BigInt(appendix);

  const version = Number(packed & 0xFFn);
  const isolated = Number((packed >> 8n) & 0x1n);
  const orderType = Number((packed >> 9n) & 0x3n);
  const reduceOnly = Number((packed >> 11n) & 0x1n);
  const trigger = Number((packed >> 12n) & 0x3n);
  // reserved: (packed >> 14n) & ((1n << 50n) - 1n)
  const value = (packed >> 64n) & ((1n << 64n) - 1n);

  const orderExecutionType = (() => {
    switch (orderType) {
      case 0: return 'default';
      case 1: return 'ioc';
      case 2: return 'fok';
      case 3: return 'post_only';
      default: return 'default';
    }
  })();

  const triggerType = (() => {
    switch (trigger) {
      case 1: return 'price';
      case 2: return 'twap';
      case 3: return 'twap_custom_amounts';
      default: return null;
    }
  })();

  return {
    value,
    version,
    isolated: isolated === 1,
    orderExecutionType,
    reduceOnly: reduceOnly === 1,
    triggerType,
  };
}

/**
 * 计算订单过期时间
 * @param {number} durationSeconds - 有效时长(秒)，0 表示 GTC
 * @returns {bigint} 过期时间戳(秒)
 */
function getOrderExpiration(durationSeconds = 0) {
  if (durationSeconds === 0) {
    // GTC: 使用一个非常大的值
    return BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60); // 1年后
  }
  return BigInt(Math.floor(Date.now() / 1000) + durationSeconds);
}

/**
 * 构建下单 EIP-712 值
 * @param {Object} params
 * @param {string} params.sender - subaccount bytes32
 * @param {number|string} params.price - 价格
 * @param {number|string} params.amount - 数量 (正=买，负=卖)
 * @param {number} params.expirationSeconds - 过期秒数，0=GTC
 * @param {string} params.nonce - 订单 nonce
 * @param {Object} params.appendixOptions - appendix 选项
 * @returns {Object}
 */
function buildOrderValues(params) {
  const {
    sender,
    price,
    amount,
    expirationSeconds = 0,
    nonce = getOrderNonce(),
    appendixOptions = {},
  } = params;

  // 价格需要乘以 10^18
  const priceX18 = toIntegerString(addDecimals(price));

  // 数量需要乘以 10^18
  const amountX18 = toIntegerString(addDecimals(amount));

  // 过期时间
  const expiration = toIntegerString(getOrderExpiration(expirationSeconds));

  // 打包 appendix
  const appendix = toIntegerString(packOrderAppendix(appendixOptions));

  return {
    sender,
    priceX18,
    amount: amountX18,
    expiration,
    nonce,
    appendix,
  };
}

/**
 * 构建取消订单 EIP-712 值
 * @param {Object} params
 * @param {string} params.sender - subaccount bytes32
 * @param {number[]} params.productIds - 产品 ID 列表
 * @param {string[]} params.digests - 订单摘要列表
 * @param {string} params.nonce - 取消 nonce
 * @returns {Object}
 */
function buildCancelOrdersValues(params) {
  const {
    sender,
    productIds,
    digests,
    nonce = getOrderNonce(),
  } = params;

  return {
    sender,
    productIds,
    digests,
    nonce,
  };
}

module.exports = {
  // 常量
  NADO_DECIMALS,
  DEFAULT_RECV_TIME_OFFSET_MS,

  // nonce
  getDefaultRecvTime,
  getOrderNonce,
  getRecvTimeFromOrderNonce,

  // 数值转换
  addDecimals,
  removeDecimals,
  toIntegerString,
  toBigInt,

  // appendix
  packOrderAppendix,
  unpackOrderAppendix,

  // 订单
  getOrderExpiration,
  buildOrderValues,
  buildCancelOrdersValues,
};
