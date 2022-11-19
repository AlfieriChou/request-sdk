'use strict';

const stock = require('..');
const assert = require('assert').strict;

assert.strictEqual(stock(), 'Hello from stock');
console.info("stock tests passed");
