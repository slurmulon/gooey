'use strict';

var gulp       = require('gulp'),
    babel      = require('gulp-babel'),
    shell      = require('gulp-shell'),
    uglify     = require('gulp-uglify'),
    source     = require('vinyl-source-stream'),
    browserify = require('browserify')

gulp.task('default', ['compile'])

gulp.task('clean', shell.task(['rm -rf lib && rm -rf dist']))

gulp.task('compile', ['clean'], function() {
  return gulp
    .src('*.js', {cwd: 'src', read: true})
    .pipe(babel())
    .pipe(gulp.dest('lib'))
})

// gulp.task('compile', ['clean'], shell.task(['node ./node_modules/.bin/babel src --out-dir lib']))

gulp.task('compress', ['compile'], function() {
  return gulp
    .src('./lib/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist'))
})

gulp.task('browserify', ['compress'], function() {
  browserify('./dist/index.js')
    .bundle()
    .pipe(source('gooey-core.js'))
    .pipe(gulp.dest('browser'))

  return gulp
    .src('./browser/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('browser'))
})

gulp.task('test', ['compile'], shell.task(['node ./node_modules/.bin/mocha --reporter nyan --compilers js:babel-core/register test']))

gulp.task('coverage', ['compile'], shell.task(['node ./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- --compilers js:babel-core/register']))
