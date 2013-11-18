'use strict';
var ProtoDict = require('protodict')
  , Dict = require('dict')
  , inspect = require('util').inspect

function createEnv(parent) {
  var env = new ProtoDict(parent)
  env.eval = parent.eval
  return env
}

function lambda(fn) {
  return function() {
    return fn.apply(this, [].map.call(arguments, this.eval, this))
  }
}

module.exports = function() {
  var env = new Dict(
      { 'lambda': function(parameters) {
          var expressions = [].slice.call(arguments, 1)
            , definitionEnv = this
          return function() {
            var env = createEnv(definitionEnv)
              , args = arguments
            parameters.forEach(function(parameter, i) {
              if (typeof parameter !== 'object' || !parameter || parameter.type !== 'Identifier')
                throw new TypeError('can only bind arguments to identifiers')
              env.set(parameter.name, this.eval(args[i]))
            }, this)
            return Thunk.from(env, expressions)
          }
        }
      // lexical binding
      , 'let': function(bindings) {
          var env = createEnv(this)
            , expressions = [].slice.call(arguments, 1)
          bindings.forEach(function(binding) {
            var ident = binding[0]
              , value = this.eval(binding[1])
            if (typeof ident !== 'object' || !ident || ident.type !== 'Identifier')
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
            if (typeof ident !== 'object' || !ident || ident.type !== 'Identifier')
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
            if (typeof ident !== 'object' || !ident || ident.type !== 'Identifier')
              throw new TypeError('can only bind values to identifiers')
            env.set(ident.name, value)
          }, this)
          return Thunk.from(env, expressions)
        }
      // dynamic binding
      , 'fluid-let': function(bindings) {
          var env = createEnv(this)
            , expressions = [].slice.call(arguments, 1)
            , save = new Dict()
            , none = {}
          bindings.forEach(function(binding) {
            var ident = binding[0]
              , value = env.eval(binding[1])
            if (typeof ident !== 'object' || !ident || ident.type !== 'Identifier')
              throw new TypeError('can only bind values to identifiers')
            save.set(ident.name, env.has(ident.name)
              ? env.get(ident.name)
              : none)
            env.set(ident.name, value)
          }, this)
          return Thunk.from(env, expressions, function() {
            save.forEach(function(value, name) {
              if (value === none)
                this.delete(name)
              else
                this.set(name, value)
            }, this)
          })
        }
      // definition
      , 'define': function(ident, value) {
          if (typeof ident !== 'object' || !ident || ident.type !== 'Identifier')
            throw new TypeError('can only bind values to identifiers')
          this.set(ident.name, value)
        }
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
  function Thunk(env, expressions, post) {
    this.env = env
    this.expressions = expressions
    this.post = typeof post == 'function'
      ? post
      : null
  }

  Thunk.of = function(env, expression, post) {
    return new Thunk(env, [expression], post)
  }

  Thunk.from = function(env, expressions, post) {
    return new Thunk(env, [].slice.call(expressions), post)
  }

  Thunk.prototype.resolve = function() {
    var ret = _eval.apply(this.env, this.expressions)
    if (typeof this.post == 'function')
      this.post.call(this.env)
    return ret
  }

  function _eval(expression) { /*jshint validthis:true*/
    if (arguments.length > 1) {
      var value
      [].forEach.call(arguments, function(expression) {
        this.eval(expression)
      }, this)
      return value
    }
    else if (typeof expression == 'number'
          || typeof expression == 'string'
          || typeof expression == 'function'
          || expression === null)
      return expression
    else if (typeof expression == 'object' && expression.type === 'Identifier')
      if (this.has(expression.name))
        return this.get(expression.name)
      else
        throw new ReferenceError(expression.name + ' is not defined')
    else if (Array.isArray(expression))
      return this.eval(expression[0]).apply(this, expression.slice(1))
    else
      throw new TypeError('unknown expression type: ' + inspect(expression))
  }

  return env
}
