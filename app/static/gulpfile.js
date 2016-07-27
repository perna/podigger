'use strict';

var gulp       = require('gulp');
var jshint     = require('gulp-jshint');
var complexity = require('gulp-complexity');
var concat     = require('gulp-concat');
var uglify     = require('gulp-uglify');
var rename     = require('gulp-rename');
var cleanCSS     = require('gulp-clean-css');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('js-complexity', function(){
    gulp.src(['./src/js/modules/*.js'])
        .pipe(complexity({
                cyclomatic: [3, 7, 12],
                halstead: [8, 13, 20],
                maintainability: 100
            })
        );
});

gulp.task('jshint', function(){
    gulp.src(['./src/js/modules/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'))
});

gulp.task('concat-js',['jshint'], function(){
    return gulp.src([
                        './src/js/lib/jquery.min.js',
                        './src/js/lib/bootstrap.min.js',
                        './src/js/lib/moment-with-locales.min.js',
                        './src/js/lib/sweetalert2.min.js',
                        './src/js/lib/Chart.min.js',
                        './src/js/modules/trends.js',
                        './src/js/modules/widgets.js',
                        './src/js/modules/main.js'
                    ])
        .pipe(concat('app.js',{newLine: ';'}))
        .pipe(gulp.dest('./dist/js/'));
});


gulp.task('minify-js', ['concat-js'], function(){
    return gulp.src('./dist/js/app.js')
        .pipe(sourcemaps.init())
            .pipe(rename('app.min.js'))
            .pipe(uglify({mangle:false, unused:true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/js/'))
});

gulp.task('css', function(){
    return gulp.src([
            './src/css/bootstrap.min.css',
            './src/css/font-awesome.min.css',
            './src/css/sweetalert2.min.css',
            './src/css/style.css'
        ])
       .pipe(sourcemaps.init())
            .pipe(concat('main.css'))
            .pipe(rename('style.min.css'))
            .pipe(cleanCSS())
       .pipe(sourcemaps.write('./'))
       .pipe(gulp.dest('./dist/css/'))
});


gulp.task('imagemin', function() {
    return gulp.src('./src/img/*')
        .pipe(imagemin(
            {
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngquant()]
            }
        ))
        .pipe(gulp.dest('./dist/img'))
});


gulp.task('default', ['minify-js','css','imagemin'], function(){
    gulp.watch('./src/js/**/*.js',['minify-js']);
    gulp.watch('./src/css/style.css',['css']);
    gulp.watch('./src/img/*',['imagemin']);
});
