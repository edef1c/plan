'use strict';
var _ = module.exports = Object.create(require('mori-plan'))
  , inspect = require('util').inspect

_.is_nil = function(val) { return val === null }

_.env = function() { return new Env() }
_.is_env = function(obj) { return obj instanceof Env }

function Env() {}
Env.prototype = Object.create(null)

function stringify_symbol(symbol) {
  if (!_.is_symbol(symbol))
    throw new TypeError("can't use non-symbol as identifier: " + symbol)
  return symbol.toString()
}

Env.prototype.has = function(symbol) {
  return ('~' + stringify_symbol(symbol)) in this
}

Env.prototype.hasOwn = function(symbol) {
  return {}.hasOwnProperty.call(this, '~' + stringify_symbol(symbol))
}

Env.prototype.get = function(symbol) {
  symbol = stringify_symbol(symbol)
  if (symbol === '@')
    return this
  var value = this['~' + symbol]
  if (typeof value == 'undefined')
    throw new ReferenceError(symbol + ' is not defined')
  return value
}

Env.prototype.set = function(symbol, value) {
  symbol = stringify_symbol(symbol)
  if (symbol === '@')
    throw new ReferenceError("that's not just a variable, dear")
  this['~' + symbol] = value
}

Env.prototype.inspect = function(depth) {
  var output = '#{'
    , first = true
  for (var key in this) if (key[0] === '~' && {}.hasOwnProperty.call(this, key)) {
    if (first)
      first = false
    else
      output += ',\n  '
    output += key.slice(1) + ' → ' + inspect(this[key])
  }
  if (this.__proto__ !== Env.prototype) {
    if (first)
      first = false
    else
      output += ',\n  '
    output += this.__proto__.inspect(depth).replace(/^/mg, '   ').slice(3)
  }
  if (!first)
    output += '\n'
  return output + '}'
}
