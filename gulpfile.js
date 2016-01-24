'use strict';

var gulp       = require('gulp'),
    babel      = require('gulp-babel'),
    shell      = require('gulp-shell'),
    source     = require('vinyl-source-stream'),
    browserify = require('browserify')

gulp.task('default', ['compile'])

gulp.task('clean', shell.task(['rm -rf dist']))

gulp.task('compile', ['clean'], function() {
  return gulp
    .src('*.js', {cwd: 'src', read: true})
    .pipe(babel())
    .pipe(gulp.dest('dist'))
})

gulp.task('browserify', ['compile'], function() {
  return browserify('./dist/index.js')
    .bundle()
    .pipe(source('gooey-browser.js'))
    .pipe(gulp.dest('./browser/'))
})

gulp.task('test', ['compile'], shell.task(['node ./node_modules/.bin/_mocha --reporter nyan --compilers js:babel/register test/']))

gulp.task('coverage', ['compile'], shell.task(['node ./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- --compilers js:babel/register']))
