#!/usr/bin/env node
'use strict';
var fs = require('fs')
  , parser = require('./parser')

var infile = process.argv[2]
  , outfile = infile.replace(/\.plan$/, '.json')
if (infile === outfile)
  throw new Error('input file must end in .plan')

var text = fs.readFileSync(infile).toString()
  , code = parser.parse(text)

fs.writeFileSync(outfile, JSON.stringify(code, function(key, value) {
  if (typeof Object(value).type == 'string')
    value.type = value.type
  return value
}, 2))
