const got = require('got')
const assert = require('assert')
const { utils, requestLog } = require('@request-sdk/base')

const pkg = require('./package.json')

const url = 'https://qt.gtimg.cn/q='
const sinaUrl = 'https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData'

module.exports = class Api {
  constructor ({
    headers,
    logger = console,
    logBody = false
  }) {
    this.logger = logger
    this.got = got.extend({
      timeout: 10000,
      headers: headers || {},
      hooks: {
        init: [
          utils.fillReqId(),
          utils.fillPkgInfo(pkg),
          utils.createLogger(this.logger)
        ]
      },
      handlers: [
        async (ctx, next) => {
          const { context: { method, data }, url: { searchParams } } = ctx
          assert(data && typeof data === 'object', 'data must be an object')
          ctx.method = method
          if (method === 'GET') {
            Object.entries(data).forEach(([key, value]) => searchParams.set(key, value))
          }
          if (method === 'POST') {
            ctx.json = data
          }
          await next(ctx)
          return ctx.res
        },
        requestLog(logBody),
        async (ctx, next) => {
          ctx.res = await next(ctx)
        }
      ]
    })
  }

  async request (url, options = {}) {
    return this.got(url, options)
      .then(res => res.body)
      .catch(err => {
        return Promise.reject(new Error(err))
      })
  }

  async get (url, data) {
    return this.request(url, {
      context: {
        method: 'GET',
        data: data || {}
      }
    })
  }

  async post (url, data) {
    return this.request(url, {
      context: {
        method: 'POST',
        data: data || {}
      }
    })
  }

  getMarketCode (code) {
    if (code.startsWith('6') || code.startsWith('5')) {
      return `sh${code}`
    }
    return `sz${code}`
  }

  // eslint-disable-next-line consistent-return
  async getCurrentInfo (code) {
    const marketCode = this.getMarketCode(code)
    try {
      const data = await this.get(`${url}${marketCode}`)
      const [, name, , currentWorth] = data.split('="')[1].split('~')
      return {
        code, name, currentWorth: parseFloat(currentWorth)
      }
    } catch (err) {
      this.logger.info('get stock current info error: ', code, err)
      throw err
    }
  }

  // eslint-disable-next-line consistent-return
  async loadHistoryData ({ code, dataLen, scale }) {
    try {
      const ret = await this.get(sinaUrl, {
        scale: scale || 60,
        ma: 60,
        symbol: this.getMarketCode(code),
        datalen: dataLen
      })
      return ret
    } catch (err) {
      this.logger.info('获取stock信息异常', code, err)
      throw err
    }
  }

  async loadDataFromPrevNDays (code, n) {
    const ret = await this.loadHistoryData({
      code, dataLen: n, scale: 240
    })
    return ret
      .map(item => {
        return {
          day: item.day,
          close: parseFloat(item.close),
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low)
        }
      })
  }

  ma ({
    list, deflate, limit
  }) {
    const total = list.reduce((sum, item) => sum + deflate(item), 0)
    return total / limit
  }

  async loadMaData ({
    code, limit, deflate
  }) {
    assert(deflate, 'deflate is required')
    assert(code, 'code is required')
    assert(limit, 'limit is required')
    const list = await this.loadDataFromPrevNDays(code, limit)
    this.logger.info('loadMaData: ', code, limit, list)
    return this.ma({ list, deflate, limit })
  }

  async loadMdData ({
    code, limit, deflate
  }) {
    assert(deflate, 'deflate is required')
    assert(code, 'code is required')
    assert(limit, 'limit is required')
    const list = await this.loadDataFromPrevNDays(code, 2 * limit)
    this.logger.info('loadMdData: ', code, limit, list)
    const maList = list.slice(limit + 1, 2 * limit + 1)
      .map((item, index) => {
        const ma = this.ma({
          list: list.slice(index, limit + index),
          deflate: item => item.close,
          limit
        })
        return {
          ...item,
          ma
        }
      })
    return parseFloat(this.ma({ list: maList, deflate, limit }).toFixed(2))
  }

  async loadCciData ({
    code, limit, coefficient = 0.015
  }) {
    assert(code, 'code is required')
    assert(limit, 'limit is required')
    const list = await this.loadDataFromPrevNDays(code, limit)
    this.logger.info('[loadCciData] list: ', code, limit, list)
    const typList = list.map(item => {
      return {
        ...item,
        typ: (item.close + item.high + item.low) / 3
      }
    })
    const typMa = this.ma({
      list: typList, deflate: item => item.typ, limit
    })
    const aveDenTyp = Math.sqrt(
      typList.reduce((ret, item) => {
        return ret + Math.pow(typMa - item.typ, 2)
      }, 0) / limit,
      2
    )
    const { typ } = typList.pop()
    return parseFloat(((typ - typMa) / (coefficient * aveDenTyp)).toFixed(2))
  }

  async loadRsiData ({
    code, limit, deflate
  }) {
    assert(deflate, 'deflate is required')
    assert(code, 'code is required')
    assert(limit, 'limit is required')
    const list = await this.loadDataFromPrevNDays(code, limit + 1)
    this.logger.info('[loadRsiData] list: ', code, limit, list)
    const rsiList = list
      .map((item, index) => {
        if (index === 0) {
          return item
        }
        return {
          ...item,
          closeDiff: item.close - list[index - 1].close
        }
      })
      .slice(1)
    this.logger.info('[loadRsiData] rsi list: ', code, limit, rsiList)
    const upList = rsiList.filter(item => item.closeDiff >= 0)
    const downList = rsiList.filter(item => item.closeDiff < 0)
    const avgUp = upList.reduce((acc, i) => acc + i.closeDiff, 0) / limit
    const avgDown = downList.reduce((acc, i) => acc + Math.abs(i.closeDiff), 0) / limit
    const rs = avgUp / avgDown
    const rsi = parseFloat((100 - (100 / (1 + rs))).toFixed(2))
    this.logger.info('[loadRsiData] data: ', code, avgUp, avgDown, rsi)
    return rsi
  }
}
