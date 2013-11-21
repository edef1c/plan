#!/usr/bin/env node
'use strict';
var argv = process.argv.slice(2)
if (argv.length === 0)
  return require('./repl').start()

var fs = require('fs')
  , Platform = require('./platform')
  , types = require('./core/types')
  , List = types.List
  , car = List.car
  , cdr = List.cdr
  , filename = argv[0]
  , argvList = List.from(argv)
  , source = fs.readFileSync(filename, 'utf8')
  , program = Platform.parse(source)
  , env = new Platform()

while (program !== null) {
  env.eval(car(program))
  program = cdr(program)
}
