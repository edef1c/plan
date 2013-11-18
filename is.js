'use strict';
var types = require('./types')
  , is = exports

for (var typeName in types) if ({}.hasOwnProperty.call(types, typeName))
  is[typeName] = typeChecker(typeName, types[typeName])

function typeChecker(typeName, Type) {
  return typeof Type.prototype.type == 'string'
    ? function(val) {
        return Object(val).type === Type.prototype.type
      }
    : function(val) {
      return Object(val) instanceof Type
    }
}

is.List = function(val) {
  return typeof Object(val).length == 'number'
      || is.Cons(val)
}

is.Nil = function(val) {
  return val === null
      || (typeof Object(val).length === 0)
}

is.PFunction = is.Function

is.Function = function(val) {
  return typeof val == 'function'
      || is.PFunction(val)
}
