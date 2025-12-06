/**
 * Nado-Lighter 对冲策略执行器
 * 在 Nado 和 Lighter 两个交易所之间执行对冲下单
 */

const { coinToSymbol } = require('../nado-sdk/src/types');

/**
 * Nado-Lighter 对冲执行器
 */
class NadoLighterHedgeExecutor {
  /**
   * @param {Object} nadoClient - Nado 客户端
   * @param {Object} lighterClient - Lighter 客户端
   * @param {Object} nadoPriceFeed - Nado 价格服务
   * @param {Object} lighterPriceFeed - Lighter 价格服务
   */
  constructor(nadoClient, lighterClient, nadoPriceFeed, lighterPriceFeed) {
    this.nadoClient = nadoClient;
    this.lighterClient = lighterClient;
    this.nadoPriceFeed = nadoPriceFeed;
    this.lighterPriceFeed = lighterPriceFeed;

    // 缓存 productId 映射
    this._productIdCache = {};
    
    // 币种符号映射
    this.symbolMap = {
      'BTC': 'BTCUSD',
      'ETH': 'ETHUSD',
      'SOL': 'SOLUSD'
    };
  }

  /**
   * 执行对冲下单
   * @param {string} coin - 币种，如 'BTC'
   * @param {number|string} size - 数量
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 执行结果
   */
  async executeHedge(coin, size, options = {}) {
    const {
      slippage = 0.001,       // 默认 0.1% 滑点
      orderType = 'ioc',      // 'ioc' 或 'limit'
      checkFill = true,       // 是否检查成交
      reverse = false,        // 是否反向（平仓时使用）
    } = options;

    const sizeNum = parseFloat(size);

    console.log('\n=== 开始执行 Nado-Lighter 对冲 ===');
    console.log(`币种: ${coin}`);
    console.log(`数量: ${sizeNum}`);
    console.log(`滑点: ${(slippage * 100).toFixed(2)}%`);
    console.log(`订单类型: ${orderType.toUpperCase()}`);
    console.log(`模式: ${reverse ? '平仓' : '开仓'}`);

    const startTime = Date.now();

    try {
      // 1. 获取两边价格
      console.log('\n步骤 1: 获取两边市场价格...');
      const lighterSymbol = this.symbolMap[coin] || `${coin}USD`;
      
      const [nadoBook, lighterBook] = await Promise.all([
        this.nadoPriceFeed.getL2Book(coinToSymbol(coin)),
        this.lighterPriceFeed.getL2Book(lighterSymbol),
      ]);

      this._logPriceComparison(nadoBook, lighterBook, coin);

      // 2. 获取 Nado productId
      const productId = await this._getProductId(coin);
      console.log(`\nNado productId: ${productId}`);

      // 3. 确定最优方向
      console.log('\n步骤 2: 确定最优对冲方向...');
      const direction = this._determineBestDirection(nadoBook, lighterBook, reverse);
      console.log(`Nado: ${direction.nadoSide.toUpperCase()}`);
      console.log(`Lighter: ${direction.lighterSide.toUpperCase()}`);

      // 4. 计算订单价格（加滑点确保成交）
      console.log('\n步骤 3: 计算订单价格...');
      const prices = this._calculatePrices(nadoBook, lighterBook, direction, slippage);
      console.log(`Nado ${direction.nadoSide} 价格: ${prices.nadoPrice}`);
      console.log(`Lighter ${direction.lighterSide} 价格: ${prices.lighterPrice}`);

      // 5. 验证最小订单金额
      this._validateMinOrderSize(coin, sizeNum, prices.nadoPrice, prices.lighterPrice);

      // 6. 构建订单
      console.log('\n步骤 4: 构建订单...');
      const nadoOrder = {
        productId,
        price: prices.nadoPrice,
        size: sizeNum,
        side: direction.nadoSide,
        orderType: orderType === 'ioc' ? 'ioc' : 'default',
      };

      const lighterOrder = {
        symbol: lighterSymbol,
        side: direction.lighterSide,
        orderType: orderType === 'limit' ? 'limit' : 'market',
        amount: sizeNum.toString(),
        price: prices.lighterPrice.toString()
      };

      // 7. 同时下单
      console.log('\n步骤 5: 提交订单...');
      const [nadoResult, lighterResult] = await Promise.all([
        this._executeNadoOrder(nadoOrder),
        this._executeLighterOrder(lighterOrder)
      ]);

      const executionTime = Date.now() - startTime;

      // 8. 检查成交（如果需要）
      const fillStatus = checkFill 
        ? await this._checkOrderFills(nadoResult, lighterResult, coin)
        : { nado: 'unknown', lighter: 'unknown' };

      // 9. 返回结果
      const result = {
        success: true,
        coin,
        size: sizeNum,
        direction: direction,
        prices: prices,
        orders: {
          nado: nadoResult,
          lighter: lighterResult
        },
        fillStatus: fillStatus,
        executionTime: executionTime,
        timestamp: Date.now()
      };

      console.log('\n✅ 对冲执行完成');
      console.log(`执行时间: ${executionTime}ms`);
      console.log(`\n成交状态:`);
      console.log(`  Nado: ${fillStatus.nado}`);
      console.log(`  Lighter: ${fillStatus.lighter}`);

      return result;

    } catch (error) {
      console.error('\n❌ 对冲执行失败:', error.message);
      
      return {
        success: false,
        coin,
        size: sizeNum,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 获取价差信息
   */
  async getSpreadInfo(coin) {
    const lighterSymbol = this.symbolMap[coin] || `${coin}USD`;
    
    const [nadoBook, lighterBook] = await Promise.all([
      this.nadoPriceFeed.getL2Book(coinToSymbol(coin)),
      this.lighterPriceFeed.getL2Book(lighterSymbol),
    ]);

    const priceDiff = nadoBook.mid - lighterBook.mid;
    const priceDiffPercent = (priceDiff / nadoBook.mid) * 100;

    // 判断推荐方向
    let direction;
    if (Math.abs(priceDiffPercent) < 0.01) {
      direction = '价差太小，不建议对冲';
    } else if (priceDiff > 0) {
      direction = 'Nado 卖出 + Lighter 买入';
    } else {
      direction = 'Nado 买入 + Lighter 卖出';
    }

    return {
      coin,
      nado: {
        bid: nadoBook.bid,
        ask: nadoBook.ask,
        mid: nadoBook.mid
      },
      lighter: {
        bid: lighterBook.bid,
        ask: lighterBook.ask,
        mid: lighterBook.mid
      },
      priceDiff,
      priceDiffPercent,
      direction
    };
  }

  /**
   * 内部方法：获取 Nado productId
   */
  async _getProductId(coin) {
    if (this._productIdCache[coin]) {
      return this._productIdCache[coin];
    }

    const symbol = coinToSymbol(coin);
    const products = await this.nadoClient.getProducts();
    
    const product = products.find(p => p.market_id === symbol);
    if (!product) {
      throw new Error(`Product not found for ${coin}`);
    }

    this._productIdCache[coin] = product.product_id;
    return product.product_id;
  }

  /**
   * 内部方法：输出价格对比
   */
  _logPriceComparison(nadoBook, lighterBook, coin) {
    console.log('\n价格对比:');
    console.log('┌─────────┬──────────────┬──────────────┐');
    console.log('│         │     Nado     │   Lighter    │');
    console.log('├─────────┼──────────────┼──────────────┤');
    console.log(`│ 买一    │ ${nadoBook.bid.toFixed(2).padStart(12)} │ ${lighterBook.bid.toFixed(2).padStart(12)} │`);
    console.log(`│ 卖一    │ ${nadoBook.ask.toFixed(2).padStart(12)} │ ${lighterBook.ask.toFixed(2).padStart(12)} │`);
    console.log(`│ 中间价  │ ${nadoBook.mid.toFixed(2).padStart(12)} │ ${lighterBook.mid.toFixed(2).padStart(12)} │`);
    console.log('└─────────┴──────────────┴──────────────┘');
    
    const priceDiff = nadoBook.mid - lighterBook.mid;
    const priceDiffPercent = (priceDiff / nadoBook.mid) * 100;
    console.log(`\n价差: ${priceDiff.toFixed(2)} (${priceDiffPercent.toFixed(4)}%)`);
  }

  /**
   * 内部方法：确定最优对冲方向
   */
  _determineBestDirection(nadoBook, lighterBook, reverse) {
    // 比较中间价，决定做多还是做空
    const nadoMid = nadoBook.mid;
    const lighterMid = lighterBook.mid;

    let nadoSide, lighterSide;

    if (!reverse) {
      // 开仓：在价格低的地方买，在价格高的地方卖
      if (nadoMid > lighterMid) {
        nadoSide = 'sell';
        lighterSide = 'buy';
      } else {
        nadoSide = 'buy';
        lighterSide = 'sell';
      }
    } else {
      // 平仓：反向操作
      if (nadoMid > lighterMid) {
        nadoSide = 'buy';
        lighterSide = 'sell';
      } else {
        nadoSide = 'sell';
        lighterSide = 'buy';
      }
    }

    return { nadoSide, lighterSide };
  }

  /**
   * 内部方法：计算订单价格
   */
  _calculatePrices(nadoBook, lighterBook, direction, slippage) {
    let nadoPrice, lighterPrice;

    // Nado 价格
    if (direction.nadoSide === 'buy') {
      // 买入：用卖一价加滑点
      nadoPrice = nadoBook.ask * (1 + slippage);
    } else {
      // 卖出：用买一价减滑点
      nadoPrice = nadoBook.bid * (1 - slippage);
    }

    // Lighter 价格
    if (direction.lighterSide === 'buy') {
      lighterPrice = lighterBook.ask * (1 + slippage);
    } else {
      lighterPrice = lighterBook.bid * (1 - slippage);
    }

    return {
      nadoPrice: parseFloat(nadoPrice.toFixed(2)),
      lighterPrice: parseFloat(lighterPrice.toFixed(2))
    };
  }

  /**
   * 内部方法：验证最小订单金额
   */
  _validateMinOrderSize(coin, size, nadoPrice, lighterPrice) {
    const MIN_ORDER_USD = 10; // 最小 10 USD

    const nadoValue = size * nadoPrice;
    const lighterValue = size * lighterPrice;

    if (nadoValue < MIN_ORDER_USD) {
      throw new Error(
        `Nado 订单金额太小: ${nadoValue.toFixed(2)} USD (最小 ${MIN_ORDER_USD} USD)`
      );
    }

    if (lighterValue < MIN_ORDER_USD) {
      throw new Error(
        `Lighter 订单金额太小: ${lighterValue.toFixed(2)} USD (最小 ${MIN_ORDER_USD} USD)`
      );
    }
  }

  /**
   * 内部方法：执行 Nado 订单
   */
  async _executeNadoOrder(order) {
    console.log(`  Nado ${order.side.toUpperCase()}: ${order.size} @ ${order.price}`);
    
    const result = await this.nadoClient.placeOrder({
      product_id: order.productId,
      amount: order.size.toString(),
      price: order.price.toString(),
      side: order.side,
      order_type: order.orderType
    });

    console.log(`  ✓ Nado 订单已提交: ${result.order_id || 'OK'}`);
    return result;
  }

  /**
   * 内部方法：执行 Lighter 订单
   */
  async _executeLighterOrder(order) {
    console.log(`  Lighter ${order.side.toUpperCase()}: ${order.amount} @ ${order.price}`);
    
    const result = await this.lighterClient.createOrder(order);

    console.log(`  ✓ Lighter 订单已提交: ${result.order_id || 'OK'}`);
    return result;
  }

  /**
   * 内部方法：检查订单成交状态
   */
  async _checkOrderFills(nadoResult, lighterResult, coin) {
    console.log('\n步骤 6: 检查成交状态...');
    
    // 简化版本，实际应该轮询检查
    return {
      nado: 'pending',
      lighter: 'pending'
    };
  }
}

module.exports = NadoLighterHedgeExecutor;
