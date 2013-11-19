'use strict';
var readline = require('readline')
  , plan = require('./')
  , init = require('./repl-env')
exports.start =
function start(stdin, stdout) {
  var face = readline.createInterface(stdin || process.stdin, stdout || process.stdout)
    , env = plan()
  init(env)

  loop()
  function loop() {
    var text = ''
    face.prompt('> ')
    face.once('line', onLine)
    function onLine(line) {
      var code
      try {
        code = plan.parse(text += line)
      }
      catch (e) {
        face.prompt('… ')
        return face.once('line', onLine)
      }
      face.pause()
      try {
        console.log(plan.operate.call(env, env.eval, code))
      }
      catch (e) {
        console.error(e.stack)
      }
      loop()
    }
  }
}
