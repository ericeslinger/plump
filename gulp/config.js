const ts = require('gulp-typescript');

module.exports = {
  dest: 'dist',
  src: 'src',
  tests: 'tests',
  types: 'types',
  scripts: ['**/*.js', '**/*.ts'],
  tsConfig: ts.createProject('src/tsconfig.json'),
};
