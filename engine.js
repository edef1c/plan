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

function createEnv(parent) {
  var env = new ProtoDict(parent)
  env.eval = parent.eval
  return env
}

module.exports = exports = newEnv
exports.lambda = lambda

var i = 0

function displayName(name, fn) {
  fn.displayName = (fn.displayName || fn.name || '') + name
  return fn
}

function lambda(fn) {
  return displayName('lambda_' + (fn.displayName || fn.name || i++), function() {
    return apply.call(this, fn, [].map.call(arguments, function(item) { return this.eval(item) }, this))
  })
}

function apply(fn, args) { /* jshint validthis:true */
  if (is.PFunction(fn))
    return fn.fn.call(this, args)
  return fn.apply(this, args)
}

function zip(parameter, argument) { /* jshint validthis:true */
  if (is.Identifier(parameter))
    this.set(parameter.name, argument)
  else if (is.List(parameter) && is.List(argument)) {
    while (!is.Nil(parameter)) {
      zip.call(this, car(parameter), car(argument))
      parameter = cdr(parameter)
      argument = cdr(argument)
    }
  }
  else
    throw new TypeError('invalid pattern')
}

var begin = lambda(function begin() { return arguments[arguments.length - 1] })

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
      { 'vau': function hostVau(parameters, envBinding) {
          return apply.call(this, vau, arguments)
        }
      , 'lambda': function hostLambda(parameters) {
          var expressions = [].slice.call(arguments, 1)
          return displayName(++i, lambda(vau.call(this, parameters, null, expressions)))
        }
      // lexical binding
      , 'let': function(bindings) {
          var env = createEnv(this)
            , expressions = [].slice.call(arguments, 1)
          bindings.forEach(function(binding) {
            var ident = binding[0]
              , value = this.eval(binding[1])
            if (!is.Identifier(ident))
              throw new TypeError('can only bind values to identifiers')
            env.set(ident.name, value)
          }, this)
          return Thunk.from(env, expressions)
        }
      , 'let*': function(bindings) {
          var env = this
            , expressions = [].slice.call(arguments, 1)
          bindings.forEach(function(binding) {
            env = createEnv(env)
            var ident = binding[0]
              , value = env.eval(binding[1])
            if (!is.Identifier(ident))
              throw new TypeError('can only bind values to identifiers')
            env.set(ident.name, value)
          }, this)
          return Thunk.from(env, expressions)
        }
      , 'letrec': function(bindings) {
          var env = createEnv(this)
            , expressions = [].slice.call(arguments, 1)
          bindings.forEach(function(binding) {
            var ident = binding[0]
              , value = env.eval(binding[1])
            if (!is.Identifier(ident))
              throw new TypeError('can only bind values to identifiers')
            env.set(ident.name, value)
          }, this)
          return Thunk.from(env, expressions)
        }
      // dynamic binding
      , 'fluid-let': function(bindings) {
          var env = this
            , expressions = [].slice.call(arguments, 1)
            , save = new Dict()
            , none = {}
          bindings.forEach(function(binding) {
            var ident = binding[0]
              , value = this.eval(binding[1])
            if (typeof ident !== 'object' || !ident || ident.type !== 'Identifier')
              throw new TypeError('can only bind values to identifiers')
            save.set(ident.name, this.has(ident.name)
              ? this.get(ident.name)
              : none)
            this.set(ident.name, value)
          }, this)
          return Thunk.from(this, expressions, function() {
            save.forEach(function(value, name) {
              if (value === none)
                this.delete(name)
              else
                this.set(name, value)
            }, this)
          })
        }
      // definition
      , 'define': function define(ident, value) {
          if (!is.Identifier(ident))
            throw new TypeError('can only bind values to identifiers')
          this.set(ident.name, this.eval(value))
        }
      // assignments
      , 'set!': function(ident, value) {
          if (typeof ident !== 'object' || !ident || ident.type !== 'Identifier')
            throw new TypeError('can only bind values to identifiers')
          this.replace(ident.name, this.eval(value))
        }
      // quoting
      , 'quote': function(expression) {
          return expression
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
      , '+': lambda(function() {
          return [].reduce.call(arguments, function(a, b) { return a + b }, 0)
        })
      , '-': lambda(function(a, b) {
          if (arguments.length === 1)
            return -a
          else if (arguments.length === 1)
            return a - b
        })
      , '*': lambda(function() {
          return [].reduce.call(arguments, function(a, b) { return a * b }, 1)
        })
      , '/': lambda(function(a, b) {
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
    return new Thunk(env, expressions.length > 1
      ? [begin].concat([].slice.call(expressions))
      : expressions[0]
      , post)
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
     || typeof expression == 'function'
     || expression === null)
      return expression
    else if (is.Identifier(expression))
      if (this.has(expression.name))
        return this.get(expression.name)
      else
        throw new ReferenceError(expression.name + ' is not defined')
    else if (is.List(expression) && (expression = Cons.toArray(expression)))
      return apply.call(this, this.eval(expression[0]), expression.slice(1))
    else
      throw new TypeError('unknown expression type: ' + inspect(expression))
  }

  return env
}
