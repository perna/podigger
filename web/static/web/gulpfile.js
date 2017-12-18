const postcss = require('gulp-postcss')
const gulp = require('gulp')
const sourcemaps = require('gulp-sourcemaps')
const cssnext = require('postcss-cssnext')
const cssnano = require('cssnano')
const atImport = require('postcss-import')

gulp.task('css', function () {
  return gulp.src('./src/css/style.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([
      atImport(),
      cssnext(),
      cssnano()
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css/'))
})

gulp.task('watch', function () {
  gulp.watch('./src/css/**/*.css', ['css'])
})
