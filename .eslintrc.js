const { eslint } = require('@uzh-bf/code-style-react-js')

module.exports = {
  ...eslint,
  env: {
    node: true,
    jest: true,
  },
}
