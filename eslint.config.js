export default [
  {
    files: ['**/*.js'],
    ignores: ['ExPlast/sitebuilder/frontend/modules/**'],
    languageOptions: { ecmaVersion: 2021, sourceType: 'module' },
    rules: {
      'max-lines': ['error', 150],
      'max-lines-per-function': ['error', 40]
    }
  }
]
