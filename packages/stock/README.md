# `stock`

> stock request sdk.

## Usage

```javascript
const Api = require('@request-sdk/stock')

const logger = console

const api = new Api({
  logger
})

const ret = await api.get('http://t.com/api/xxx', {
  a: 'b'
}, {
  responseType: 'json'
})

const ret2 = await api.post('http://t.com/api/xxx', {
  a: 'b'
}, {
  responseType: 'json'
})
```

### methods

* get

```javascript
api.get('http://t.com/api/xxx', {
  a: 'b'
}, {
  responseType: 'json'
})
```

* post

```javascript
api.post('http://t.com/api/xxx', {
  a: 'b'
}, {
  responseType: 'json'
})
```

* loadHistoryData

```javascript
api.loadHistoryData({
  code: '600900', dataLen: 11, scale: 240
})
```

* loadDataFromPrevNDays

```javascript
api.loadDataFromPrevNDays('600900', 11)
```

* loadMaData

```javascript
api.loadMaData({
  code: '600900', limit: 11, deflate: x => x.close
})
```

* loadMdData

```javascript
api.loadMdData({
  code: '600900', limit: 11, deflate: x => x.close
})
```

* loadCciData

```javascript
api.loadCciData({
  code: '600900', limit: 14, coefficient: 0.015
})
```

* loadRsiData

```javascript
api.loadRsiData({
  code: '600900', limit: 12, deflate: x => x.close
})
```
