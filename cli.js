#!/usr/bin/env node
'use strict';
var fs = require('fs')
  , plan = require('./')

var file = process.argv[2]
  , text = fs.readFileSync(file).toString()
  , code = plan.parse(text)
  , env = plan.createEnv()

env.set('log', plan.lambda(console.log.bind(console)))

var result = env.eval.apply(env, code)

console.log(result)
