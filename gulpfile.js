var gulp = require('gulp');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

gulp.task('default', function () {
  return gulp.src('src/*.js')
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/src'));
});

gulp.task('build-test', function () {
  return gulp.src('test/test.js')
    .pipe(sourcemaps.init())
    .pipe(concat('test.js'))
    //.pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(rename('test.min.js'))
    .pipe(gulp.dest('dist/test'));
});

gulp.task('test', ['default', 'build-test'], function () {
  var mocha = require('gulp-mocha');
  return gulp.src('dist/test/test.min.js').pipe(mocha());
});
