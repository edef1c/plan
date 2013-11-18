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
  else if (Array.isArray(val)) {
    var cons = null
    for (var i = val.length - 1; i >=0; i--)
      cons = Cons.of(val[i], cons)
    return cons
  }
  else
    throw new TypeError("can't make a list from that")
}

Cons.toArray = function() {
  var ret = []
    , cons = this
  while (cons !== null) {
    if (!(cons instanceof Cons))
      throw new TypeError("can't make an array from that")
    ret.push(cons.car)
    cons = cons.cdr
  }
  return ret
}
