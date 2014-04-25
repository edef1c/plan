'use strict';
var _ = require('./types')

function lambda(fn) {
  return function() { var env = this
    return _.apply(fn.bind(env), _.map(env.eval.bind(env), _.vector.apply(_, arguments)))
  }
}

function uncurry(fn) {
  return function(thisObj) {
    var args = [].slice.call(arguments, 1)
    return fn.apply(thisObj, args)
  }
}

var Plan = module.exports = require('./evaluator')
  , env = new Plan()

env.set = function(symbol, value) {
  return (this === env && symbol.toString()[0] !== '$')
    ? Plan.prototype.set(symbol, value)
    : Plan.prototype.set.call(this, symbol, value)
}

function introduce(identifier, value) {
  env.set(_.symbol(identifier), value)
}

introduce('#f', false)
introduce('#t', true)

// bring mori stuff in here
Object.keys(_)
  .filter(function(key) { return key.match(/^is_/) })
  .forEach(function(key) {
    introduce(key.replace(/^is_/, '').replace(/_/g, '-') + '?', lambda(_[key]))
  })

;['first', 'nth', 'rest', 'list', 'vector', 'hash_map', 'sorted_set', 'range', 'cons']
  .forEach(function(key) {
    introduce(key.replace(/_/g, '-'), lambda(_[key]))
  })

introduce('eval'   , lambda(uncurry(Plan.prototype.eval)))
introduce('operate', lambda(uncurry(Plan.prototype.operate)))

introduce('bool', lambda(bool))
introduce('$vau', mVau)
introduce('def', mDefine)

function bool(cond, ifTrue, ifFalse) { var env = this /* jshint validthis:true */
  return cond !== false
    ? ifTrue
    : ifFalse
}

function mDefine(symbol, $value) { var env = this /* jshint validthis:true */
  env.set(symbol, env.eval($value))
}

function mVau(parameters, envParamater, body) { var definitionEnv = this /* jshint validthis:true */
  return function() { var callingEnv = this
    var env = Object.create(definitionEnv)
    env.set(parameters, _.vector.apply(_, arguments))
    env.set(envParamater, callingEnv)
    return env.eval(body)
  }
}

introduce('+', lambda(function(a, b) { return a + b }))
introduce('-', lambda(function(a, b) { return a - b }))
introduce('*', lambda(function(a, b) { return a * b }))
introduce('/', lambda(function(a, b) { return a / b }))
introduce('%', lambda(function(a, b) { return a % b }))

introduce('=', lambda(_.equals))

introduce('<', lambda(function(a, b) { return a < b }))
introduce('>', lambda(function(a, b) { return a > b }))

var fs = require('fs')
  , source = fs.readFileSync(__dirname + '/env.plan', 'utf8')
  , code = require('../parser').parse(source)

while (!_.is_empty(code)) {
  env.eval(_.first(code))
  code = _.rest(code)
}

function slugCase(str) {
  return str
    .replace(/[a-z][A-Z]/, function(s) { return s[0] + '-' + s[1].toLowerCase() })
    .toLowerCase()
}
