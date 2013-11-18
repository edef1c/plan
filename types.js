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

Cons.car = function(val) {
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

Cons.cdr = function(val) {
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

for (var typeName in exports) if ({}.hasOwnProperty.call(typeName, exports))
  exports[typeName].prototype.name = typeName
