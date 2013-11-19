'use strict';
var ProtoDict = require('protodict')
  , Dict = require('dict')
  , _inspect = require('util').inspect
  , is = require('./is')
  , types = require('./types')
  , Cons = types.Cons
  , car = Cons.car
  , cdr = Cons.cdr
  , nil = Cons.nil
  , PFunction = types.Function
  , Foreign = types.Foreign
  , fs = require('fs')
  , init = require('./parser').parse(fs.readFileSync(require.resolve('./env.plan')).toString())

function inspect(val) {
  return _inspect(val, { depth: nil })
}

function createEnv(parent) {
  var env = new ProtoDict(parent)
  env.eval = parent.eval
  return env
}

module.exports = exports = newEnv
exports.wrap = wrap

var i = 0

function displayName(name, fn) {
  fn.displayName = (fn.displayName || fn.name || '') + name
  return fn
}

function wrap(fn) {
  return displayName('wrapped_' + (fn.displayName || fn.name || i++), function() {
    return operate.call(this, fn, [].map.call(arguments, function(item) { return this.eval(item) }, this))
  })
}

exports.operate = operate
function operate(fn, args) { /* jshint validthis:true */
  if (is.PFunction(fn))
    return fn.fn.call(this, Cons.from(args))
  if (typeof fn != 'function')
    throw new TypeError('not a function')
  return fn.apply(this, Cons.toArray(args))
}

exports.zip = zip
function zip(parameter, argument, replace) { /* jshint validthis:true */
  if (is.Identifier(parameter))
    (replace
      ? this.replace
      : this.set)(parameter.name, argument)
  else if (is.List(parameter) && is.List(argument)) {
    while (is.List(parameter) && !is.Nil(parameter)) {
      zip.call(this, car(parameter), is.Nil(argument)
        ? nil
        : car(argument))
      parameter = cdr(parameter)
      argument = is.Nil(argument)
        ? nil
        : cdr(argument)
    }
    if (!is.Nil(parameter))
      zip.call(this, parameter, argument, replace)
  }
  else
    throw new TypeError('invalid pattern: ' + inspect(parameter) + ' :: ' + inspect(argument))
}

var begin = wrap(function begin() { return arguments[arguments.length - 1] })

function newEnv() {
  function vau(parameters, envBinding, expressions) { /*jshint validthis:true */
    var definitionEnv = this
    return new PFunction(function vau_(args) {
      var env = createEnv(definitionEnv)
      zip.call(env, parameters, args)
      return Thunk.from(env, expressions)
    })
  }

  var env = new Dict(
      // list processing
      { 'car': car
      , 'cdr': cdr
      , 'null?': is.Nil
      // funcy shit
      , 'vau': function hostVau(parameters, envBinding) {
          var expressions = [].slice.call(arguments, 2)
          return vau.call(this, parameters, envBinding, expressions)
        }
      , 'lambda': function hostLambda(parameters) {
          var expressions = [].slice.call(arguments, 1)
          return displayName(++i, wrap(vau.call(this, parameters, nil, expressions)))
        }
      // environment
      , 'eval': wrap(function($env, expression) {
          return Foreign.unwrap($env).eval(expression)
        })
      , 'operate': wrap(function($env, operative, operands) {
          return operate.call(Foreign.unwrap(env), operative, operands)
        })
      // error reporting
      , 'error': wrap(function(error) {
          throw new Error(error)
        })
      // definition
      , 'define': function define(ident, value) {
          zip.call(this, ident, this.eval(value))
        }
      // assignments
      , 'set!': function(ident, value) {
          zip.call(this, ident, this.eval(value), true)
        }
      // conditionals
      , 'bool': wrap(function(expression, ifTrue, ifFalse) {
          return expression
            ? ifTrue
            : ifFalse
        })
      , '#t': true
      , '#f': false
      // sequencing
      , 'begin': begin
      // basic arithmetic functions
      , '+': wrap(function() {
          return [].reduce.call(arguments, function(a, b) { return a + b }, 0)
        })
      , '-': wrap(function(a, b) {
          if (arguments.length === 1)
            return -a
          else if (arguments.length === 1)
            return a - b
        })
      , '*': wrap(function() {
          return [].reduce.call(arguments, function(a, b) { return a * b }, 1)
        })
      , '/': wrap(function(a, b) {
          return a / b
        })
      })

  env.eval = function(expression) {
    var ret = Thunk.from(this, arguments)
    while (ret instanceof Thunk)
      ret = ret.resolve()
    return ret
  }

  Thunk.prototype.type = 'Thunk'
  function Thunk(env, expression, post) {
    this.env = env
    this.expression = expression
    this.post = typeof post == 'function'
      ? post
      : nil
  }

  Thunk.of = function(env, expression, post) {
    return new Thunk(env, expression, post)
  }

  Thunk.from = function(env, expressions, post) {
    expressions = is.Nil(expressions)
      ? nil
      : is.Nil(cdr(expressions))
        ? car(expressions)
        : Cons.of(begin, Cons.from(expressions))

    return new Thunk(env, expressions, post)
  }

  Thunk.prototype.resolve = function() {
    var ret = _eval.call(this.env, this.expression)
    if (typeof this.post == 'function')
      this.post.call(this.env)
    return ret
  }

  var _eval = function _eval(expression) { /*jshint validthis:true*/
    if (typeof expression == 'number'
     || typeof expression == 'string'
     || is.Function(expression)
     || is.Nil(expression)
     || is.Foreign(expression))
      return expression
    else if (is.Identifier(expression))
      if (this.has(expression.name))
        return this.get(expression.name)
      else
        throw new ReferenceError(expression.name + ' is not defined')
    else if (is.List(expression) && (expression = Cons.toArray(expression)))
      return operate.call(this, this.eval(expression[0]), expression.slice(1))
    else
      throw new TypeError('unknown expression type: ' + inspect(expression))
  }

  if (process.env.DEBUG) {
    _eval = (function(_eval) {
      return function(expression) {
        var ret
        try {
          ret = _eval.call(this, expression)
        }
        catch (e) {
          console.error(inspect(expression) + ' -> \u1f4a3')
          throw e
        }
        console.log(inspect(expression) + ' -> ' + inspect(ret))
        return ret
      }
    })(_eval)
  }


  env.set('env', Foreign.of(env))
  operate.call(env, env.eval, init)

  return env
}
