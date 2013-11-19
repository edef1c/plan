'use strict';
var readline = require('readline')
exports.start =
function start(stdin, stdout) {
  var face = readline.createInterface(stdin || process.stdin, stdout || process.stdout)
    , plan = require('./')
    , env = plan()

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
      console.log(plan.operate.call(env, env.eval, code))
      loop()
    }
  }
}
