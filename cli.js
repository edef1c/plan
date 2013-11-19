#!/usr/bin/env node
'use strict';
if (process.argv.length <= 2)
  return require('./repl').start()

var fs = require('fs')
  , plan = require('./')

var env = plan.createEnv()
  , file = process.argv[2]
  , text = fs.readFileSync(file).toString()
  , code = plan.parse(text)

env.set('log', plan.lambda(console.log.bind(console)))

var result = plan.operate.call(env, env.eval, code)

console.log(result)
