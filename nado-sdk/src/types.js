/**
 * Nado SDK 类型定义
 * 币种与交易对映射、订单类型、网络配置等
 */

/**
 * 链 ID 配置
 */
const ChainId = {
  INK_MAINNET: 57073,
  INK_TESTNET: 763373,  // Ink Sepolia
};

/**
 * 合约部署地址
 */
const Deployments = {
  inkMainnet: {
    chainId: ChainId.INK_MAINNET,
    rpcUrl: 'https://ink.drpc.org',
    explorerUrl: 'https://explorer.inkonchain.com',
    quote: '0x0200C29006150606B650577BBE7B6248F58470c1',
    clearinghouse: '0xD218103918C19D0A10cf35300E4CfAfbD444c5fE',
    endpoint: '0x05ec92D78ED421f3D3Ada77FFdE167106565974E',  // sequencer
    perpEngine: '0xF8599D58d1137fC56EcDd9C16ee139C8BDf96da1',
    spotEngine: '0xFcD94770B95fd9Cc67143132BB172EB17A0907fE',
  },
  inkTestnet: {
    chainId: ChainId.INK_TESTNET,
    rpcUrl: 'https://rpc-gel-sepolia.inkonchain.com',
    explorerUrl: 'https://explorer-sepolia.inkonchain.com',
    quote: '0x60F50F902b2E91aef7D6c700Eb22599e297fa86F',
    clearinghouse: '0x23a283B359D55A941bBeEC58801B6b17D955CC73',
    endpoint: '0x698D87105274292B5673367DEC81874Ce3633Ac2',  // sequencer
    perpEngine: '0x4E859C47fea3666B5053B16C81AF64e77567702e',
    spotEngine: '0x3352b2fF0fAc4ce38A6eA1C188cF4F924df54E5D',
  },
};

/**
 * 订单执行类型 (用于 appendix)
 */
const OrderExecutionType = {
  DEFAULT: 'default',
  IOC: 'ioc',       // Immediate or Cancel
  FOK: 'fok',       // Fill or Kill
  POST_ONLY: 'post_only',  // 只做 Maker
};

/**
 * 币种与 Nado 交易对符号映射
 * 基于 Hyperliquid 的映射方式
 */
const COIN_TO_SYMBOL = {
  'BTC': 'BTC-PERP',
  'ETH': 'ETH-PERP',
  'SOL': 'SOL-PERP',
  'ARB': 'ARB-PERP',
  'AVAX': 'AVAX-PERP',
  'MATIC': 'MATIC-PERP',
  'OP': 'OP-PERP',
  'ATOM': 'ATOM-PERP',
  'DOGE': 'DOGE-PERP',
  'LTC': 'LTC-PERP',
  'BCH': 'BCH-PERP',
  'XRP': 'XRP-PERP',
  'ADA': 'ADA-PERP',
  'DOT': 'DOT-PERP',
  'LINK': 'LINK-PERP',
  'UNI': 'UNI-PERP',
  'AAVE': 'AAVE-PERP',
  'APT': 'APT-PERP',
  'SUI': 'SUI-PERP',
  'INJ': 'INJ-PERP',
};

/**
 * 反向映射：交易对符号到币种
 */
const SYMBOL_TO_COIN = Object.fromEntries(
  Object.entries(COIN_TO_SYMBOL).map(([k, v]) => [v, k])
);

/**
 * 币种转换为 Nado 交易对符号
 * @param {string} coin - 币种，如 'BTC'
 * @returns {string} Nado 交易对符号，如 'BTC-PERP'
 */
function coinToSymbol(coin) {
  const symbol = COIN_TO_SYMBOL[coin.toUpperCase()];
  if (!symbol) {
    throw new Error(`不支持的币种: ${coin}`);
  }
  return symbol;
}

/**
 * Nado 交易对符号转换为币种
 * @param {string} symbol - 交易对符号，如 'BTC-PERP'
 * @returns {string} 币种，如 'BTC'
 */
function symbolToCoin(symbol) {
  const coin = SYMBOL_TO_COIN[symbol];
  if (coin) {
    return coin;
  }
  // 如果未找到，尝试移除 -PERP 后缀
  return symbol.replace('-PERP', '').toUpperCase();
}

/**
 * 订单类型枚举
 */
const OrderType = {
  LIMIT: 'limit',
  MARKET: 'market',
};

/**
 * 订单方向枚举
 */
const OrderSide = {
  BUY: 'buy',
  SELL: 'sell',
};

/**
 * 时效性枚举
 */
const TimeInForce = {
  GTC: 'GTC',  // Good Till Cancel - 一直有效直到取消
  IOC: 'IOC',  // Immediate Or Cancel - 立即成交或取消
  FOK: 'FOK',  // Fill Or Kill - 全部成交或取消
};

/**
 * 触发类型枚举
 */
const TriggerType = {
  STOP_LOSS: 'stop_loss',
  TAKE_PROFIT: 'take_profit',
};

/**
 * 订单状态枚举
 */
const OrderStatus = {
  PENDING: 'pending',
  OPEN: 'open',
  FILLED: 'filled',
  PARTIALLY_FILLED: 'partially_filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

module.exports = {
  // 网络配置
  ChainId,
  Deployments,
  OrderExecutionType,

  // 映射表
  COIN_TO_SYMBOL,
  SYMBOL_TO_COIN,

  // 转换函数
  coinToSymbol,
  symbolToCoin,

  // 枚举
  OrderType,
  OrderSide,
  TimeInForce,
  TriggerType,
  OrderStatus,
};
