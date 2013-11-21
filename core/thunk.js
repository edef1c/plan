'use strict';
module.exports =
function Thunk(env, expression) {
  this.env = env
  this.expression = expression
}
