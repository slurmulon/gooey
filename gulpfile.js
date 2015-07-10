'use strict';

var gulp  = require('gulp'),
    babel = require('gulp-babel'),
    shell = require('gulp-shell')

gulp.task('clean', shell.task(['rm -rf dist']))

gulp.task('default', ['clean'], function() {
  return gulp.src('index.js', {cwd: 'src', read: true})
    .pipe(babel())
    .pipe(gulp.dest('dist'))
})
