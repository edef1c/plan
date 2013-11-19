'use strict';
var ProtoDict = require('protodict')
  , Dict = require('dict')
  , inspect = require('util').inspect
  , is = require('./is')
  , types = require('./types')
  , Cons = types.Cons
  , car = Cons.car
  , cdr = Cons.cdr
  , PFunction = types.Function
  , Foreign = types.Foreign
  , fs = require('fs')
  , init = require('./parser').parse(fs.readFileSync(require.resolve('./env.plan')).toString())

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
  args = Cons.toArray(args)
  if (is.PFunction(fn))
    return fn.fn.call(this, args)
  return fn.apply(this, args)
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
        ? null
        : car(argument))
      parameter = cdr(parameter)
      argument = is.Nil(argument)
        ? null
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
          return displayName(++i, wrap(vau.call(this, parameters, null, expressions)))
        }
      // environment
      , 'eval': wrap(function($env, expression) {
          return Foreign.unwrap($env).eval(expression)
        })
      , 'operate': wrap(function($env, operative, operands) {
          return operate.call(Foreign.unwrap(env), operative, operands)
        })
      , 'create-env': wrap(function($env) {
          return Foreign.wrap(createEnv(Foreign.unwrap($env)))
        })
      , 'set-env!': function($env, binding, value) {
          zip.call(Foreign.unwrap(this.eval($env)), binding, this.eval(value))
        }
      // error reporting
      , 'error': wrap(function(error) {
          throw new Error(error)
        })
      // lexical binding
      , 'let': function(bindings) {
          var env = createEnv(this)
            , expressions = [].slice.call(arguments, 1)
          Cons.forEach.call(this, bindings, function(binding) {
            var ident = car(binding)
              , value = createEnv(this).eval(car(cdr(binding)))
            zip.call(env, ident, value)
          })
          return Thunk.from(env, expressions)
        }
      , 'let*': function(bindings) {
          var env = this
            , expressions = [].slice.call(arguments, 1)
          Cons.forEach.call(this, bindings, function(binding) {
            env = createEnv(env)
            var ident = car(binding)
              , value = this.eval(car(cdr(binding)))
            zip.call(env, ident, value)
          })
          return Thunk.from(env, expressions)
        }
      , 'letrec': function(bindings) {
          var env = createEnv(this)
            , expressions = [].slice.call(arguments, 1)
          Cons.forEach.call(this, bindings, function(binding) {
            var ident = car(binding)
              , value = this.eval(car(cdr(binding)))
            zip.call(env, ident, value)
          })
          return Thunk.from(env, expressions)
        }
      // definition
      , 'define': function define(ident, value) {
          zip.call(this, ident, this.eval(value))
        }
      // assignments
      , 'set!': function(ident, value) {
          zip.call(this, ident, this.eval(value), true)
        }
      // conditionals
      , 'if': function(expression, ifTrue, ifFalse) {
          return this.eval(this.eval(expression)
            ? ifTrue
            : ifFalse)
        }
      , 'cond': function() {
          var clauses = [].slice.call(arguments)
            , len = clauses.length
          for (var i = 0; i < len; i++) {
            var clause = clauses[i]
              , condition = clause[0]
              , expression = clause[1]
            if (this.eval(condition))
              return this.eval(expression)
          }
        }
      , 'else': true
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
      : null
  }

  Thunk.of = function(env, expression, post) {
    return new Thunk(env, expression, post)
  }

  Thunk.from = function(env, expressions, post) {
    expressions = is.Nil(expressions)
      ? null
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

  function _eval(expression) { /*jshint validthis:true*/
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

  env.set('env', Foreign.of(env))
  operate.call(env, env.eval, init)

  return env
}
