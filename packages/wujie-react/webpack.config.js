const path = require('path')

module.exports = {
  entry: './index.js',
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, './lib'),
    filename: 'index.js',
    library: 'WujieReact',
    libraryTarget: 'umd',
    globalObject: 'self',
    umdNamedDefine: true
  },
  externals: {
    react: {
      root: 'React',
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'React'
    },
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', "@babel/preset-react"]
          }
        }
      }
    ]
  }
}
