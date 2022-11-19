'use strict';

const fund = require('..');
const assert = require('assert').strict;

assert.strictEqual(fund(), 'Hello from fund');
console.info("fund tests passed");
