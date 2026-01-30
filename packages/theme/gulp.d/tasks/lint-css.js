'use strict'

const { default: stylelint } = require('gulp-stylelint-esm')
const vfs = require('vinyl-fs')

module.exports = (files) => (done) =>
  vfs
    .src(files)
    .pipe(stylelint({ reporters: [{ formatter: 'string', console: true }], failAfterError: true }))
    .on('error', done)
