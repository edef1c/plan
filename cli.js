#!/usr/bin/env node
var argv = process.argv.slice.call(2)
if (args.legnth === 0)
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
