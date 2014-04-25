'use strict';
module.exports = Plan

var _ = require('./types')

function Plan() {}
Plan.prototype = _.env()

var indent = 0
function debug() {
  if (process.env.DEBUG)
    console.log.apply(console, ['DEBUG: ' + new Array(indent).join('-') + '|'].concat([].slice.call(arguments)))
}

Plan.prototype.eval = function(exp) {
  indent++
  var ret = mEval.call(this, exp)
  indent--
  return ret
}

function mEval(exp) { var env = this /* jshint validthis:true */
  if (_.is_symbol(exp)) {
    debug('resolving symbol', exp)
    var ret = env.get(exp)
    debug('returning', ret)
    return ret
  }
  else if (_.is_list(exp)) {
    if (_.is_empty(exp)) {
      debug('passing through empty list')
      return exp
    }
    else {
      debug('evaluating fn', _.first(exp), 'with args', _.rest(exp))
      var ret = env.operate(env.eval(_.first(exp)), _.rest(exp))
      debug('returning', ret)
      return ret
    }
  }
  else if (_.is_seqable(exp)) {
    debug('evaluating seqable', exp)
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
