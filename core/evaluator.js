'use strict';
module.exports = Plan

var _ = require('./types')

function Plan() {}
Plan.prototype = _.env()

function debug() {
  if (process.env.DEBUG)
    console.log.apply(console, arguments)
}

Plan.prototype.eval =
function mEval(exp) { var env = this /* jshint validthis:true */
  if (_.is_symbol(exp)) {
    debug('resolving symbol', exp)
    return env.get(exp)
  }
  else if (_.is_list(exp)) {
    if (_.is_empty(exp)) {
      debug('passing through empty list')
      return exp
    }
    else {
      debug('evaluating fn', _.first(exp), 'with args', _.rest(exp))
      return env.operate(env.eval(_.first(exp)), _.rest(exp))
    }
  }
  else if (_.is_vector(exp)) {
    debug('evaluating vector', exp)
    return _.map(function(exp) { return env.eval(exp) }, exp)
  }
  else {
    debug('passing through literal', exp)
    return exp
  }
}

Plan.prototype.operate =
function mOperate(operative, operands) { var env = this
  if (typeof operative !== 'function')
    throw new TypeError('not a function: ' + {}.toString.call(operative))
  return _.apply(operative.bind(env), operands)
}
