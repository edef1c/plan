'use strict';
module.exports = Platform

var Plan = require('./')
  , ffi = Plan.ffi
  , types = Plan.types
  , Symbol = types.Symbol

function Platform() {}
Platform.__proto__ = Plan
Platform.prototype = new Plan()

introduce('log', ffi(console.log.bind(console)))

function introduce(identifier, value) {
  Platform.prototype.set(Symbol.of(identifier), value)
}
