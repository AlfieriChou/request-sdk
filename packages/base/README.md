# `base`

> request sdk utils and middleware

## Usage

```
const { utils, requestLog } = require('@request-sdk/base')

const logBody = false
requestLog(logBody)

utils.fillReqId()

const pkg = require('./package.json')
utils.fillPkgInfo(pkg)

const logger = console
utils.createLogger(logger)
```

### middleware

* requestLog

### utils

* fillReqId

* fillPkgInfo

* createLogger
