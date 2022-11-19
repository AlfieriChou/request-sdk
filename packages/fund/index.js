const { format } = require('date-fns')
const got = require('got')
const htmlTableToJson = require('html-table-to-json')
const assert = require('assert')
const { utils, requestLog } = require('@request-sdk/base')

const pkg = require('../package.json')

const url = 'https://fundf10.eastmoney.com/F10DataApi.aspx'
const currentUrl = 'http://fundgz.1234567.com.cn'

const LIMIT = 47
const ONE_DAY = 24 * 60 * 60 * 1000

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

  async loadHistoryData (code, params) {
    return this.get(url, {
      ...params,
      code,
      type: 'lsjz'
    })
  }

  parseHistoryData (str) {
    const htmlTable = str.split('"')[1]
    const { results } = htmlTableToJson.parse(htmlTable)
    return results[0].reduce((ret, item) => {
      if (!item['单位净值']) {
        return ret
      }
      return [...ret, {
        date: item['净值日期'],
        unitNetWorth: parseFloat(item['单位净值']),
        totalNetWorth: parseFloat(item['累计净值']),
        dailyGrowthRate: parseFloat((item['日增长率'] || '0%').split('%')[0]),
        applyStatus: item['申购状态'],
        redemptionStatus: item['赎回状态']
      }]
    }, [])
  }

  async loadDataFromPrevNDays (code, n) {
    const page = Math.ceil(n / LIMIT)
    let currentPage = 1
    let list = []
    try {
      while (currentPage <= page) {
        const ret = await this.loadHistoryData(code, {
          page: currentPage,
          per: LIMIT
        })
        list = list.concat(this.parseHistoryData(ret))
        currentPage += 1
      }
      return list.slice(0, n)
    } catch (err) {
      this.logger.warn('获取历史基金数据异常', code, err)
      throw err
    }
  }

  async loadDataFromPrevNDaysV2 ({
    code, days, dateInfo: { date }
  }) {
    const endDateStr = format(date, 'yyyy-MM-dd')
    const startDateStr = format(date - 2 * days * ONE_DAY, 'yyyy-MM-dd')
    const page = Math.ceil(days / LIMIT)
    let currentPage = 1
    let list = []
    try {
      while (currentPage <= page) {
        const ret = await this.loadHistoryData(code, {
          page: currentPage,
          per: LIMIT,
          edate: endDateStr,
          sdate: startDateStr
        })
        list = list.concat(this.parseHistoryData(ret))
        currentPage += 1
      }
      return list.slice(0, days)
    } catch (err) {
      this.logger.warn('获取历史基金数据异常', code, err)
      throw err
    }
  }

  async loadMaData ({
    code, limit, deflate, dateInfo
  }) {
    assert(code, 'code is required')
    assert(limit, 'limit is required')
    assert(deflate, 'deflate is required')
    assert(dateInfo, 'dateInfo is required')
    const list = await this.loadDataFromPrevNDaysV2({
      code, days: limit, dateInfo
    })
    this.logger.info('loadMaData: ', code, limit, dateInfo, list)
    const total = list.reduce((sum, item) => sum + deflate(item), 0)
    return parseFloat((total / limit).toFixed(4))
  }

  async loadCurrentMaData ({
    code, limit, deflate
  }) {
    assert(code, 'code is required')
    assert(limit, 'limit is required')
    assert(deflate, 'deflate is required')
    let list = await this.loadDataFromPrevNDays(code, limit)
    this.logger.info('loadCurrentMaData: history ', code, limit, list)
    const currentData = await this.getCurrentData(code)
    this.logger.info('loadCurrentMaData: current ', code, limit, currentData)
    if (currentData && Object.keys(currentData).length > 0) {
      const existCurrentData = list.find(item => item.date === currentData.date)
      if (!existCurrentData) {
        list = [currentData, ...list].slice(0, limit)
      }
    }
    this.logger.info('loadCurrentMaData: ', code, limit, JSON.stringify(list))
    const total = list.reduce((sum, item) => sum + deflate(item), 0)
    return parseFloat((total / limit).toFixed(4))
  }

  async loadCurrentData (code) {
    return this.get(`${currentUrl}/js/${code}.js`, {
      rt: Date.now()
    })
  }

  parseCurrentData (str) {
    return JSON.parse(str.split('jsonpgz(')[1].split(');')[0])
  }

  async getCurrentData (code) {
    try {
      const ret = await this.loadCurrentData(code)
      if (!ret.includes(code)) {
        return {}
      }
      const data = await this.parseCurrentData(ret)
      return {
        name: data.name,
        code,
        unitNetWorth: parseFloat(data.gsz),
        currentWorth: parseFloat(data.gsz),
        dailyGrowthRate: parseFloat(data.gszzl),
        date: data.gztime.split(' ')[0]
      }
    } catch (err) {
      this.logger.warn('获取当前基金数据异常', code, err)
      throw err
    }
  }
}
