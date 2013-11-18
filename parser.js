'use strict';
module.exports = exports = require('./grammar')
var parser = exports.parser
  , yy = parser.yy = parser.yy || {}
yy.Identifier = Identifier

function Identifier(name) {
  this.name = name
}

Identifier.of = function(name) { return new Identifier(name) }
Identifier.prototype.type = 'Identifier'
Identifier.prototype.inspect = function() {
  return '[Identifier ' + this.name + ']'
}
