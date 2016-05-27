var gulp = require('gulp');

gulp.task('default', ['test'], function () {
});

gulp.task('test', function () {
  var mocha = require('gulp-mocha');
  return gulp.src('test/test.js').pipe(mocha());
});
