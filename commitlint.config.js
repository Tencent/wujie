const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'ci', 'test', 'build', 'release', 'chore', 'revert', 'workflow']

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-empty': [2, 'never'],
    'type-enum': [2, 'always', types],
    'scope-case': [0, 'always'],
    'subject-empty': [2, 'never'],
    'subject-case': [0, 'never'],
    'header-max-length': [2, 'always', 88]
  }
}
