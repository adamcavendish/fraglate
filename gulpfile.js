var gulp = require('gulp');
var concat = require('gulp-concat');
//var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function () {
  return gulp.src('src/*.js')
    .pipe(sourcemaps.init())
    //.pipe(babel())
    .pipe(concat('all.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/src'));
});

gulp.task('build-test', function () {
  return gulp.src('test/*.js')
    .pipe(sourcemaps.init())
    //.pipe(babel())
    .pipe(gulp.dest('dist/test'));
});

gulp.task('test', ['default', 'build-test'], function () {
  var mocha = require('gulp-mocha');
/*
  return gulp.src("dist/test/*.js", {read:false})
    .pipe(mocha());
*/
  return gulp.src('dist/test/test.js').pipe(mocha());
});
