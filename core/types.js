'use strict';
var inspect = require('util').inspect
  , is = exports.is = Object.create(require('./is-native'))


is.Symbol = function(object) { return object instanceof symbolConstructor }
var symbolConstructor = function Symbol(identifier) { this.identifier = identifier }
  , Symbol = exports.Symbol = { name: 'Symbol', prototype: symbolConstructor.prototype }

Symbol.of = function(identifier) { return new symbolConstructor(identifier) }

Symbol.prototype.inspect = function() {
  return this.identifier
}


is.Pair = function(object) { return object instanceof pairConstructor }
var pairConstructor = function Pair(car, cdr) {
      this.car = car
      this.cdr = cdr
    }
  , Pair = exports.Pair = { name: 'Pair', prototype: pairConstructor.prototype }

Pair.of = function(car, cdr) { return new pairConstructor(car, cdr) }

Pair.car = car
function car(object) {
  if (!is.Pair(object)) {
    if (object === null)
      throw new TypeError("can't take car of nil")
    else
      throw new TypeError("can't take car of non-pair")
  }
  return object.car
}

Pair.cdr = cdr
function cdr(object) {
  if (!is.Pair(object)) {
    if (object === null)
      throw new TypeError("can't take car of nil")
    else
      throw new TypeError("can't take car of non-pair")
  }
  return object.cdr
}

Pair.prototype.inspect = function(depth) {
  var pair = this
    , output = '('
    , first = true
  while (pair !== null) {
    if (first)
      first = false
    else
      output += ' '
    if (is.Pair(pair)) {
      output += inspect(car(pair), { depth: depth - 1 })
      pair = cdr(pair)
    }
    else {
      output += '. ' + inspect(pair, { depth: depth - 1})
      break
    }
  }
  return output + ')'
}


var List = exports.List = Object.create(Pair)
List.name = 'List'

List.of = function() { return List.from(arguments) }

List.from = function(object) {
  if (object === null)
    return null
  var list
    , cur
  if (is.Pair(object)) {
    list = Pair.of(car(object), null)
    cur = list
    object = cdr(object)
    while (object !== null) {
      cur = cur.cdr = Pair.of(car(object), null)
      object = cdr(object)
    }
    return list
  }
  if (is.ArrayLike(object)) {
    var len = object.length
    if (len === 0)
      return null
    list = Pair.of(object[0], null)
    cur = list
    for (var i = 1; i < len; i++)
      cur = cur.cdr = Pair.of(object[i], null)
    return list
  }
  throw new TypeError("can only make a list from a list or an array-like")
}

List.toArray = function(list) {
  var arr = []
  while (list !== null) {
    arr.push(car(list))
    list = cdr(list)
  }
  return arr
}

is.Env = function(object) { return object instanceof Env }
exports.Env = Env

function Env() {}
Env.prototype = Object.create(null)

Env.prototype.has = function(symbol) {
  if (!is.Symbol(symbol))
    throw new TypeError("can't use non-symbol as identifier")
  return ('~' + symbol.identifier) in this
}

Env.prototype.hasOwn = function(symbol) {
  if (!is.Symbol(symbol))
    throw new TypeError("can't use non-symbol as identifier")
  return {}.hasOwnProperty.call(this, '~' + symbol.identifier)
}

Env.prototype.get = function(symbol) {
  if (!is.Symbol(symbol))
    throw new TypeError("can't use non-symbol as identifier")
  if (symbol.identifier === '@')
    return this
  var value = this['~' + symbol.identifier]
  if (typeof value == 'undefined')
    throw new ReferenceError(symbol.identifier + ' is not defined')
  return value
}

Env.prototype.set = function(symbol, value) {
  if (!is.Symbol(symbol))
    throw new TypeError("can't use non-symbol as identifier")
  if (symbol.identifier === '@')
    throw new ReferenceError("that's not just a variable, dear")
  this['~' + symbol.identifier] = value
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

