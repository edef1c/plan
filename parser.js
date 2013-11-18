'use strict';
module.exports = exports = require('./grammar')
var Identifier = require('./types').Identifier

var parser = exports.parser
  , yy = parser.yy = parser.yy || {}
yy.Identifier = Identifier


