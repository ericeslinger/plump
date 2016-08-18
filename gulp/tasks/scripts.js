const gulp = require('gulp');
const config = require('../config');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const ts = require('gulp-typescript');
const merge2 = require('merge2');

function build() {
  const tsPipe = gulp.src(config.scripts, {cwd: config.src})
  // .pipe(sourcemaps.init())
  .pipe(ts(
    config.tsConfig,
    {
      typescript: require('typescript'),
      declaration: true,
      noExternalResolve: false,
    }
  ));

  // return tsPipe.dts.pipe(gulp.dest(config.dest));

  return merge2([
    tsPipe.dts.pipe(gulp.dest(config.dest)),
    tsPipe.js.pipe(babel({
      presets: ['babel-preset-es2015'],
      plugins: ['transform-es2015-modules-commonjs'],
    }))
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.dest)),
  ]);
}

module.exports = build;

gulp.task('build', build);
