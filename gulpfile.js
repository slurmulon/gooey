'use strict';

var gulp  = require('gulp'),
    babel = require('gulp-babel'),
    shell = require('gulp-shell')

gulp.task('default', ['compile'])

gulp.task('clean', shell.task(['rm -rf dist']))

gulp.task('compile', ['clean'], function() {
  return gulp.src('*.js', {cwd: 'src', read: true})
  .pipe(babel())
  .pipe(gulp.dest('dist'))
})

gulp.task('test', ['compile'], shell.task(['mocha --reporter nyan --compilers js:mocha-traceur test/']))

gulp.task('coverage', ['compile'], shell.task(['./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- --compilers js:babel/register']))
