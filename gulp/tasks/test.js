const gulp = require('gulp');
const mocha = require('gulp-mocha');
const config = require('../config');
const Bluebird = require('bluebird');

const tests = [
  'model',
  'plump',
  'memory',
];

tests.forEach(test => {
  gulp.task(`test:${test}`, () => {
    Bluebird.config({
      longStackTraces: true,
    });
    return gulp.src(`${config.tests}/${test}.spec.js`, { cwd: config.dest, read: false })
    .pipe(mocha());
  });
});

gulp.task('test', () => {
  Bluebird.config({
    longStackTraces: true,
  });
  return gulp.src(`${config.tests}/**/*.spec.js`, { cwd: config.dest, read: false })
  .pipe(mocha());
});
