'use strict';
var plan = require('./')
module.exports = function(env) {
  env.set('log', plan.wrap(console.log.bind(console)))
}
