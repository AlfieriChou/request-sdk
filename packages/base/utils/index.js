const crypto = require('crypto')

exports.fillReqId = () => ctx => {
  ctx.id = crypto.randomUUID()
}

exports.createLogger = logger => ctx => {
  ctx.logger = ctx.context?.logger || logger
}

exports.fillPkgInfo = pkg => ctx => {
  ctx.pkg = pkg
}
