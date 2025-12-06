/**
 * Nado SDK EIP-712 签名模块
 * 基于 Nado TypeScript SDK 实现
 */

const { encodePacked, keccak256, toHex } = require('viem');

/**
 * 获取 Nado EIP-712 Domain
 * @param {string} verifyingContract - 合约地址
 * @param {number} chainId - 链 ID
 * @returns {Object}
 */
function getNadoEIP712Domain(verifyingContract, chainId) {
  return {
    name: 'Nado',
    version: '0.0.1',
    chainId,
    verifyingContract,
  };
}

/**
 * 获取订单签名的 verifyingContract 地址
 * 订单使用 productId 转换成的地址
 * @param {number} productId - 产品 ID
 * @returns {string}
 */
function getOrderVerifyingAddress(productId) {
  // address(uint160(productId))
  return '0x' + productId.toString(16).padStart(40, '0');
}

/**
 * 获取下单 EIP-712 类型定义
 * @returns {Object}
 */
function getPlaceOrderTypes() {
  return {
    Order: [
      { name: 'sender', type: 'bytes32' },
      { name: 'priceX18', type: 'int128' },
      { name: 'amount', type: 'int128' },
      { name: 'expiration', type: 'uint64' },
      { name: 'nonce', type: 'uint64' },
      { name: 'appendix', type: 'uint128' },
    ],
  };
}

/**
 * 获取取消订单 EIP-712 类型定义
 * @returns {Object}
 */
function getCancelOrdersTypes() {
  return {
    Cancellation: [
      { name: 'sender', type: 'bytes32' },
      { name: 'productIds', type: 'uint32[]' },
      { name: 'digests', type: 'bytes32[]' },
      { name: 'nonce', type: 'uint64' },
    ],
  };
}

/**
 * 获取取消产品所有订单的 EIP-712 类型定义
 * @returns {Object}
 */
function getCancelProductOrdersTypes() {
  return {
    CancellationProducts: [
      { name: 'sender', type: 'bytes32' },
      { name: 'productIds', type: 'uint32[]' },
      { name: 'nonce', type: 'uint64' },
    ],
  };
}

/**
 * 将 subaccount 转换为 bytes32 hex 字符串
 * subaccount = keccak256(abi.encodePacked(address, subaccountName))
 * @param {string} address - 钱包地址
 * @param {string} subaccountName - 子账户名称 (默认空字符串)
 * @returns {string} bytes32 hex
 */
function subaccountToHex(address, subaccountName = '') {
  // 将地址转为 20 字节
  const addressBytes = address.toLowerCase();

  // 将 subaccountName 转为 12 字节 (padEnd)
  let nameBytes;
  if (subaccountName === '' || subaccountName === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    // 默认子账户使用 12 字节零值
    nameBytes = '0x000000000000000000000000';
  } else {
    // 将字符串转为 bytes12
    const encoder = new TextEncoder();
    const encoded = encoder.encode(subaccountName);
    const bytes12 = new Uint8Array(12);
    for (let i = 0; i < Math.min(encoded.length, 12); i++) {
      bytes12[i] = encoded[i];
    }
    nameBytes = toHex(bytes12);
  }

  // 拼接 address (20 bytes) + name (12 bytes) = 32 bytes
  const combined = addressBytes + nameBytes.slice(2); // 移除 0x
  return combined;
}

/**
 * 签名下单请求
 * @param {Object} account - viem account
 * @param {Object} orderValues - 订单 EIP-712 值
 * @param {number} productId - 产品 ID
 * @param {number} chainId - 链 ID
 * @returns {Promise<string>} 签名
 */
async function signOrder(account, orderValues, productId, chainId) {
  const domain = getNadoEIP712Domain(
    getOrderVerifyingAddress(productId),
    chainId
  );

  const types = getPlaceOrderTypes();

  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: 'Order',
    message: orderValues,
  });

  return signature;
}

/**
 * 签名取消订单请求
 * @param {Object} account - viem account
 * @param {Object} cancelValues - 取消订单 EIP-712 值
 * @param {string} sequencerAddress - sequencer 合约地址
 * @param {number} chainId - 链 ID
 * @returns {Promise<string>} 签名
 */
async function signCancelOrders(account, cancelValues, sequencerAddress, chainId) {
  const domain = getNadoEIP712Domain(sequencerAddress, chainId);

  const types = getCancelOrdersTypes();

  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: 'Cancellation',
    message: cancelValues,
  });

  return signature;
}

/**
 * 签名取消产品所有订单请求
 * @param {Object} account - viem account
 * @param {Object} cancelValues - 取消订单 EIP-712 值
 * @param {string} sequencerAddress - sequencer 合约地址
 * @param {number} chainId - 链 ID
 * @returns {Promise<string>} 签名
 */
async function signCancelProductOrders(account, cancelValues, sequencerAddress, chainId) {
  const domain = getNadoEIP712Domain(sequencerAddress, chainId);

  const types = getCancelProductOrdersTypes();

  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: 'CancellationProducts',
    message: cancelValues,
  });

  return signature;
}

module.exports = {
  getNadoEIP712Domain,
  getOrderVerifyingAddress,
  getPlaceOrderTypes,
  getCancelOrdersTypes,
  getCancelProductOrdersTypes,
  subaccountToHex,
  signOrder,
  signCancelOrders,
  signCancelProductOrders,
};
