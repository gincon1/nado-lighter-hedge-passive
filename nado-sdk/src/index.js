const NadoClient = require('./client');
const NadoPriceFeed = require('./price_feed');
const {
  coinToSymbol,
  symbolToCoin,
  COIN_TO_SYMBOL,
  SYMBOL_TO_COIN,
  OrderType,
  OrderSide,
  TimeInForce,
  TriggerType,
  OrderStatus,
  ChainId,
  Deployments,
  OrderExecutionType,
} = require('./types');
const {
  floatToStringForHashing,
  formatPrice,
  formatSize,
  calculateSpreadPercent,
  isValidPrivateKey,
  ensureHexPrefix,
  delay,
  retry,
} = require('./utils');
const {
  getOrderNonce,
  addDecimals,
  removeDecimals,
  toIntegerString,
  packOrderAppendix,
  unpackOrderAppendix,
  getOrderExpiration,
} = require('./orders');
const {
  subaccountToHex,
  getOrderVerifyingAddress,
  getNadoEIP712Domain,
} = require('./signer');

module.exports = {
  // 核心类
  NadoClient,
  NadoPriceFeed,

  // 网络配置
  ChainId,
  Deployments,
  OrderExecutionType,

  // 类型映射
  coinToSymbol,
  symbolToCoin,
  COIN_TO_SYMBOL,
  SYMBOL_TO_COIN,

  // 枚举
  OrderType,
  OrderSide,
  TimeInForce,
  TriggerType,
  OrderStatus,

  // 工具函数
  floatToStringForHashing,
  formatPrice,
  formatSize,
  calculateSpreadPercent,
  isValidPrivateKey,
  ensureHexPrefix,
  delay,
  retry,

  // 订单工具
  getOrderNonce,
  addDecimals,
  removeDecimals,
  toIntegerString,
  packOrderAppendix,
  unpackOrderAppendix,
  getOrderExpiration,

  // 签名工具
  subaccountToHex,
  getOrderVerifyingAddress,
  getNadoEIP712Domain,
};
