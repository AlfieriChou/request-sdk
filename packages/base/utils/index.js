const shortId = require('shortid')

exports.fillReqId = () => ctx => {
  ctx.id = shortId.generate()
}

exports.createLogger = logger => ctx => {
  ctx.logger = ctx.context?.logger || logger
}

exports.fillPkgInfo = pkg => ctx => {
  ctx.pkg = pkg
}
