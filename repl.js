'use strict';
var readline = require('readline')
  , inspect = require('util').inspect
  , Plan = require('./platform')
  , types = Plan.types
  , List = types.List
  , car = List.car
  , cdr = List.cdr

exports.start =
function start(stdin, stdout) {
  var face = readline.createInterface(stdin || process.stdin, stdout || process.stdout)
    , env = new Plan()

  loop()
  function loop() {
    var text = ''
    face.setPrompt('> ')
    face.prompt()
    face.once('line', onLine)
    function onLine(line) {
      var code
      try {
        code = Plan.parse(text += line)
      }
      catch (e) {
        face.setPrompt('.. ')
        face.prompt()
        return face.once('line', onLine)
      }

      face.pause()
      var ret
      try {
        while (code !== null) {
          ret = env.eval(car(code))
          code = cdr(code)
        }
      }
      catch (e) {
        console.error(e.stack)
      }
      console.log(inspect(ret, { depth: null, colors: true }))
      face.removeListener('SIGINT', interrupt)
      loop()
    }

    face.once('SIGINT', interrupt)
    function interrupt() {
      face.removeListener('line', onLine)
      loop()
    }
  }
}

if (require.main === module)
  exports.start()
