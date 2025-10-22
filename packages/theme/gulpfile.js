const { dest, parallel, series, src, watch } = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const gulpif = require('gulp-if')
const merge = require('merge-stream')
const { Transform } = require('stream')
const zip = require('gulp-zip')
const del = require('del')
const map = (transform) => new Transform({ objectMode: true, transform })
const fs = require('fs').promises
const path = require('path')

const buildDir = 'build'
const srcDir = 'src'
const destDir = `${buildDir}/ui`

const clean = () => del([buildDir])

const css = () =>
  src(`${srcDir}/css/*.css`)
    .pipe(postcss([autoprefixer()]))
    .pipe(dest(`${destDir}/css`))

const js = () =>
  src([
    `${srcDir}/js/vendor/*.js`,
    `${srcDir}/js/*.js`
  ])
    .pipe(concat('site.js'))
    .pipe(uglify())
    .pipe(dest(`${destDir}/js`))

const images = () =>
  src(`${srcDir}/img/**/*`)
    .pipe(dest(`${destDir}/img`))

const fonts = () =>
  src(`${srcDir}/font/**/*`)
    .pipe(dest(`${destDir}/font`))

const layouts = () =>
  src(`${srcDir}/layouts/*.hbs`)
    .pipe(dest(`${destDir}/layouts`))

const partials = () =>
  src(`${srcDir}/partials/*.hbs`)
    .pipe(dest(`${destDir}/partials`))

const helpers = () =>
  src(`${srcDir}/helpers/*.js`)
    .pipe(dest(`${destDir}/helpers`))

const copyStaticFiles = () =>
  merge(css(), js(), layouts(), partials())

const bundle = () => {
  const bundleName = 'ui-bundle.zip'
  return src(`${destDir}/**/*`)
    .pipe(zip(bundleName))
    .pipe(dest(buildDir))
}

const build = series(clean, copyStaticFiles, bundle)

module.exports = {
  build,
  bundle,
  clean,
  css,
  js,
  'bundle:dev': series(copyStaticFiles),
  default: build
}