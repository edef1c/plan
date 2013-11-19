'use strict';
exports.Cons = Cons

function Cons(car, cdr) {
  this.car = car
  this.cdr = cdr
}

Cons.of = function(car, cdr) {
  return new Cons(car, cdr)
}

Cons.from = function(val) {
  if (val === null)
    return null
  else if (val instanceof Cons)
    return val
  else if (val && typeof val.length == 'number') {
    var cons = null
    for (var i = val.length - 1; i >=0; i--)
      cons = Cons.of(val[i], cons)
    return cons
  }
  else
    throw new TypeError("can't make a list from that")
}

Cons.toArray = function(cons) {
  if (cons && typeof cons.length == 'number')
    return [].slice.call(cons)
  var ret = []
  while (cons !== null) {
    if (!(cons instanceof Cons))
      throw new TypeError("can't make an array from that")
    ret.push(cons.car)
    cons = cons.cdr
  }
  return ret
}

Cons.car = car
function car(val) {
  if (val === null)
    throw new TypeError('attempt to get car out of nil')
  if (val instanceof Cons)
    return val.car
  else if (typeof Object(val).length == 'number') {
    if (val.length !== 0)
      return val[0]
    else
      throw new TypeError('attempt to get car out of nil')
  }
  else
    throw new TypeError('attempt to get car on non-cons')
}

Cons.cdr = cdr
function cdr(val) {
  if (val === null)
    throw new TypeError('attempt to get cdr out of nil')
  if (val instanceof Cons)
    return val.cdr
  else if (typeof Object(val).length == 'number') {
    if (val.length === 1)
      return null
    else if (val.length > 1)
      return Cons.from([].slice.call(val, 1))
    else
      throw new TypeError('attempt to get cdr out of nil')
  }
  else
    throw new TypeError('attempt to get cdr on non-cons')
}

Cons.map = function(l, f) {
  if (is.Nil(l))
    return null
  var cons = new Cons()
    , prev = null
    , cur = cons
  while (!is.Nil(l)) {
    cur.car = f.call(this, car(l))
    l = cdr(l)
    prev = cur
    cur = cur.cdr = new Cons()
  }
  prev.cdr = null
  return cons
}

Cons.forEach = function(l, f) {
  while (!is.Nil(l)) {
    f.call(this, car(l))
    l = cdr(l)
  }
}

exports.Identifier = Identifier
function Identifier(name) {
  this.name = name
}

Identifier.of = function(name) { return new Identifier(name) }
Identifier.prototype.inspect = function() {
  return '[Identifier ' + this.name + ']'
}

exports.Function = function Function(fn) {
  this.fn = fn
}

exports.Foreign = Foreign
function Foreign(val) {
  this.val = val
}

Foreign.of = function(val) {
  return new Foreign(val)
}

Foreign.unwrap = function(obj) {
  if (Object(obj).type !== 'Foreign')
    throw new TypeError('not a foreign object')
  return obj.val
}

for (var typeName in exports) if ({}.hasOwnProperty.call(exports, typeName))
  exports[typeName].prototype.type = typeName

var is = require('./is')
