exports.getMarketCode = code => {
  if (code.startsWith('6') || code.startsWith('5')) {
    return `sh${code}`
  }
  return `sz${code}`
}
