'use strict';
var engine = require('./engine')
  , parser = require('./parser')

module.exports = exports = createEnv
exports.createEnv = createEnv
exports.lambda = engine.lambda
exports.operate = engine.operate

function createEnv() {
  return engine()
}

exports.parse = function(text) {
  return parser.parse(text)
}
