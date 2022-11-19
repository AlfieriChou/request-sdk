module.exports = (logBody = false) => {
  return async (ctx, next) => {
    try {
      await next(ctx)
      ctx.logger.info(
        `[${ctx.pkg.name}@${ctx.pkg.version}]`,
        'request',
        {
          id: ctx.id,
          method: ctx.method,
          url: ctx.url.href,
          requestBody: JSON.stringify(ctx.json || {})
        }
      )
      const time = ctx.res.timings.end - ctx.res.timings.start
      ctx.logger.info(
        `[${ctx.pkg.name}@${ctx.pkg.version}]`,
        'response',
        {
          id: ctx.id,
          method: ctx.method,
          url: ctx.url.href,
          time,
          responseBody: logBody ? JSON.stringify(ctx.res.body) : ''
        }
      )
    } catch (err) {
      ctx.logger.error(
        `[${ctx.pkg.name}@${ctx.pkg.version}]`,
        'error',
        {
          id: ctx.id,
          url: ctx.url.href,
          method: ctx.method,
          requestBody: ctx.json ? JSON.stringify(ctx.json) : ctx.body,
          response: ctx.res && ctx.res.body
        },
        err
      )
    }
  }
}
