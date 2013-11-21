'use strict';
var types = require('./types')
  , is = types.is
  , Pair = types.Pair
  , car = Pair.car
  , cdr = Pair.cdr
  , List = types.List
  , Dict = types.Dict
  , fcomp = require('fcomp')
  , Thunk = require('./thunk')
  , curriedFunctionToApplicative = fcomp(uncurry, functionToApplicative)
  , curriedFunctionToOperative = fcomp(uncurry, functionToOperative)

function functionToApplicative(fn) {
  return function(args) { var env = this
    return fn.apply(env, List.toArray(args).map(env.eval, env))
  }
}

function functionToOperative(fn) {
  return function(args) { var env = this
    return fn.apply(env, List.toArray(args))
  }
}

function uncurry(fn) {
  return function(thisObj) {
    var args = [].slice.call(arguments, 1)
    return fn.apply(thisObj, args)
  }
}

var Plan = module.exports = require('./evaluator')
  , types = require('./types')
  , Symbol = types.Symbol

Plan.ffi = functionToApplicative

function introduce(identifier, value) {
  Plan.prototype.set(Symbol.of(identifier), value)
}

for (var type in is)
  introduce(slugCase(type) + '?', functionToApplicative(is[type]))

introduce('#f', false)
introduce('#t', true)

introduce('car'    , functionToApplicative(car))
introduce('cdr'    , functionToApplicative(cdr))
introduce('cons'   , functionToApplicative(Pair.of))

introduce('eval'   , curriedFunctionToApplicative(Plan.prototype.eval))
introduce('operate', curriedFunctionToApplicative(Plan.prototype.operate))

introduce('bool'   , functionToApplicative(bool))
introduce('vau'    , functionToOperative(mVau))

function bool(cond, ifTrue, ifFalse) { var env = this /* jshint validthis:true */
  return cond !== false
    ? ifTrue
    : ifFalse
}

function mDefine(symbol, $value) { var env = this /* jshint validthis:true */
  env.set(symbol, env.eval($value))
}

function mVau(parameters, envParamater, body) { var definitionEnv = this /* jshint validthis:true */
  return function(args) { var callingEnv = this
    var env = Object.create(definitionEnv)
    set(env, parameters, args)
    env.set(envParamater, callingEnv)
    return new Thunk(env, body)
  }
}

function set(env, symbol, value) {
  if (symbol === null)
    return
  if (is.Pair(symbol)) {
    set(env, car(symbol), value === null
      ? null
      : car(value))
    set(env, cdr(symbol), value === null
      ? null
      : cdr(value))
    return
  }
  env.set(symbol, value)
}

introduce('dict-get'    , curriedFunctionToApplicative(Dict.prototype.get))
introduce('dict-define!', curriedFunctionToApplicative(Dict.prototype.set))
introduce('dict-parent' , curriedFunctionToApplicative(function() { return this.__proto__ }))
introduce('dict-has'    , curriedFunctionToApplicative(Dict.prototype.has))
introduce('dict-has-own', curriedFunctionToApplicative(Dict.prototype.hasOwn))


introduce('+', functionToApplicative(function(a, b) { return a + b }))
introduce('-', functionToApplicative(function(a, b) { return a - b }))
introduce('*', functionToApplicative(function(a, b) { return a * b }))
introduce('/', functionToApplicative(function(a, b) { return a / b }))
introduce('%', functionToApplicative(function(a, b) { return a % b }))

introduce('eq?', functionToApplicative(function(a, b) { return a === b }))

introduce('<', functionToApplicative(function(a, b) { return a < b }))
introduce('>', functionToApplicative(function(a, b) { return a > b }))

var fs = require('fs')
  , source = fs.readFileSync(require.resolve('./env.plan'), 'utf8')
  , code = require('../parser').parse(source)

while (code !== null) {
  Plan.prototype.eval(car(code))
  code = cdr(code)
}

function slugCase(str) {
  return str
    .replace(/[a-z][A-Z]/, function(s) { return s[0] + '-' + s[1].toLowerCase() })
    .toLowerCase()
}

