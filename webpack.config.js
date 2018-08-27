const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: ['node-fetch', 'babel-polyfill', `./src/index.js`],
  output: {
    path: __dirname,
    filename: 'build/[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              'env',
              'stage-0'
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['build'])
  ]
};