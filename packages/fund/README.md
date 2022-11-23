# `fund`

> fund request sdk.

## Usage

```javascript
const Api = require('@request-sdk/fund')

const logger = console

const fund = new Api({
  logger
})

const ret = await fund.get('http://t.com/api/xxx', {
  a: 'b'
})

const ret2 = await fund.post('http://t.com/api/xxx', {
  a: 'b'
})
```

### methods

* get

```javascript
fund.get('http://t.com/api/xxx', {
  a: 'b'
})
```

* post

```javascript
fund.post('http://t.com/api/xxx', {
  a: 'b'
})
```

* loadDataFromPrevNDays

```javascript
fund.loadDataFromPrevNDays('004744', 11)
```

* loadDataFromPrevNDaysV2

```javascript
fund.loadDataFromPrevNDaysV2({
  code: '004744',
  days: 11,
  dateInfo: {
    date: 1669132800000
  }
})
```

* loadMaData

```javascript
fund.loadMaData({
  code: '004744',
  limit: 11,
  deflate: x => x.unitNetWorth,
  dateInfo: {
    date: 1669132800000
  }
})
```

* loadCurrentMaData

```javascript
fund.loadCurrentMaData({
  code: '004744',
  limit: 11,
  deflate: x => x.unitNetWorth
})
```

* getCurrentData

```javascript
fund.getCurrentData('004744')
```
