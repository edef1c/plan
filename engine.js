'use strict';
var ProtoDict = require('protodict')
  , Dict = require('dict')
  , inspect = require('util').inspect

function createEnv(parent) {
  var env = new ProtoDict(parent)
  env.eval = parent.eval
  return env
}

module.exports = function() {
  var env = new Dict(
      { 'let': function(bindings) {
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
      , 'lambda': function(parameters) {
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
      , '+': function() {
          return [].reduce.call(arguments, function(a, b) { return a + b }, 0)
        }
      , '-': function(a, b) {
          if (arguments.length === 1)
            return -a
          else if (arguments.length === 1)
            return a - b
        }
      , '*': function() {
          return [].reduce.call(arguments, function(a, b) { return a * b }, 1)
        }
      , '/': function(a, b) {
          return a / b
        }
      })

  env.eval = function(expression) {
    var ret = Thunk.from(this, arguments)
    while (ret instanceof Thunk)
      ret = ret.resolve()
    return ret
  }

  Thunk.prototype.type = 'Thunk'
  function Thunk(env, expressions) {
    this.env = env
    this.expressions = expressions
  }

  Thunk.of = function(env, expression) {
    return new Thunk(env, [expression])
  }

  Thunk.from = function(env, expressions) {
    return new Thunk(env, [].slice.call(expressions))
  }

  Thunk.prototype.resolve = function() {
    return _eval.apply(this.env, this.expressions)
  }

  function _eval(expression) { /*jshint validthis:true*/
    if (arguments.length > 1)
      return [].reduce.call(arguments, function(acc, expression) { return this.evaluate(expression) }, null, this)
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
