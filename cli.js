#!/usr/bin/env node
'use strict';
if (process.argv.length <= 2)
  return require('./repl').start()

var fs = require('fs')
  , plan = require('./')
  , init = require('./repl-env')

var env = plan.createEnv()
init(env)

var file = process.argv[2]
  , text = fs.readFileSync(file).toString()
  , code = plan.parse(text)

var result = plan.operate.call(env, env.eval, code)

console.log(result)
