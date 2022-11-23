const htmlTableToJson = require('html-table-to-json')

exports.parseHistoryData = str => {
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

exports.parseCurrentData = str => {
  return JSON.parse(str.split('jsonpgz(')[1].split(');')[0])
}
