/**
 * Nado-Lighter 对冲操作
 * 封装开仓、平仓等高级操作
 */

const NadoLighterHedgeExecutor = require('./hedge_executor');

class HedgeOperations {
  constructor(nadoClient, lighterClient, nadoPriceFeed, lighterPriceFeed) {
    this.nadoClient = nadoClient;
    this.lighterClient = lighterClient;
    this.nadoPriceFeed = nadoPriceFeed;
    this.lighterPriceFeed = lighterPriceFeed;
    
    this.executor = new NadoLighterHedgeExecutor(
      nadoClient,
      lighterClient,
      nadoPriceFeed,
      lighterPriceFeed
    );
  }

  /**
   * 开仓
   */
  async open(coin, size, options = {}) {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║              对冲开仓                   ║');
    console.log('╚════════════════════════════════════════╝');
    
    try {
      const result = await this.executor.executeHedge(coin, size, {
        ...options,
        reverse: false
      });
      
      if (result.success) {
        console.log('\n✅ 开仓成功！');
        this._logResult(result);
      } else {
        console.log('\n❌ 开仓失败:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('\n❌ 开仓异常:', error.message);
      throw error;
    }
  }

  /**
   * 平仓
   */
  async close(coin, options = {}) {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║              对冲平仓                   ║');
    console.log('╚════════════════════════════════════════╝');
    
    try {
      // 如果没有指定 size，获取当前持仓
      let size = options.size;
      
      if (!size) {
        console.log('\n获取当前持仓...');
        const positions = await this._getCurrentPositions(coin);
        size = Math.abs(positions.nado || 0);
        
        if (size === 0) {
          console.log('⚠️ 没有持仓需要平仓');
          return { success: true, message: 'No positions to close' };
        }
        
        console.log(`当前持仓: ${size}`);
      }
      
      const result = await this.executor.executeHedge(coin, size, {
        ...options,
        reverse: true
      });
      
      if (result.success) {
        console.log('\n✅ 平仓成功！');
        this._logResult(result);
      } else {
        console.log('\n❌ 平仓失败:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('\n❌ 平仓异常:', error.message);
      throw error;
    }
  }

  /**
   * 往返对冲（开仓后立即平仓）
   */
  async roundtrip(coin, size, options = {}) {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║            往返对冲开始                 ║');
    console.log('╚════════════════════════════════════════╝');
    
    // 开仓
    const openResult = await this.open(coin, size, options);
    
    if (!openResult.success) {
      console.log('\n❌ 开仓失败，中止往返');
      return { success: false, openResult };
    }
    
    // 等待一小段时间
    console.log('\n⏰ 等待 2 秒...');
    await this._sleep(2000);
    
    // 平仓
    const closeResult = await this.close(coin, { ...options, size });
    
    if (!closeResult.success) {
      console.log('\n⚠️ 平仓失败，但开仓成功');
      return { success: false, openResult, closeResult };
    }
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║          ✅ 往返对冲完成                ║');
    console.log('╚════════════════════════════════════════╝');
    
    return {
      success: true,
      openResult,
      closeResult
    };
  }

  /**
   * 内部方法：获取当前持仓
   */
  async _getCurrentPositions(coin) {
    try {
      // 获取 Nado 持仓
      const nadoInfo = await this.nadoClient.getSubaccountInfo();
      let nadoPosition = 0;
      
      if (nadoInfo.perp_balances) {
        const productId = await this.executor._getProductId(coin);
        const pos = nadoInfo.perp_balances.find(
          b => b.product_id === productId
        );
        if (pos) {
          nadoPosition = parseFloat(pos.balance.amount) / 1e18;
        }
      }
      
      // 获取 Lighter 持仓
      const lighterPositions = await this.lighterClient.getPositions();
      let lighterPosition = 0;
      
      const symbol = this.executor.symbolMap[coin] || `${coin}USD`;
      const orderBookId = this.lighterClient.getOrderBookId(symbol);
      
      const pos = lighterPositions.find(
        p => p.order_book_id === orderBookId
      );
      if (pos) {
        lighterPosition = parseFloat(pos.size);
      }
      
      return {
        nado: nadoPosition,
        lighter: lighterPosition
      };
    } catch (error) {
      console.error('获取持仓失败:', error.message);
      return { nado: 0, lighter: 0 };
    }
  }

  /**
   * 内部方法：输出结果
   */
  _logResult(result) {
    console.log('\n执行详情:');
    console.log(`  币种: ${result.coin}`);
    console.log(`  数量: ${result.size}`);
    console.log(`  方向: Nado ${result.direction.nadoSide} / Lighter ${result.direction.lighterSide}`);
    console.log(`  价格: Nado ${result.prices.nadoPrice} / Lighter ${result.prices.lighterPrice}`);
    console.log(`  耗时: ${result.executionTime}ms`);
  }

  /**
   * 内部方法：睡眠
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = HedgeOperations;
