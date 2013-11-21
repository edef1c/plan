'use strict';
module.exports = Plan

var types = require('./types')
  , is = types.is
  , List = types.List
  , car = List.car
  , cdr = List.cdr
  , Env = types.Env
  , Thunk = require('./thunk')

function Plan() {}
Plan.prototype = new Env()

Plan.prototype.eval = function mEval(exp) {
  var ret = new Thunk(this, exp)
  while (ret instanceof Thunk)
    ret = mEval_.call(ret.env, ret.expression)
  return ret
}

function mEval_(exp) { var env = this /* jshint validthis:true */
  if (is.Symbol(exp))
    return env.get(exp)
  else if (is.Pair(exp))
    return env.operate(env.eval(car(exp)), cdr(exp))
  else
    return exp
}

Plan.prototype.operate =
function mOperate(operative, operands) { var env = this
  if (typeof operative !== 'function')
    throw new TypeError('not a function')
  return operative.call(env, operands)
}
