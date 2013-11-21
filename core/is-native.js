'use strict';
var is = module.exports = Object.create(null)

is.Null = function(object) { return object === null }

is.String    = function(object) { return typeof object == 'string'  }
is.Number    = function(object) { return typeof object == 'number'  }
is.Boolean   = function(object) { return typeof object == 'boolean' }

is.Object    = function(object) { return typeof object == 'object' && object }
is.Array     = function(object) { return object instanceof Array }
is.ArrayLike = function(object) { return typeof Object(object).length == 'number' }

