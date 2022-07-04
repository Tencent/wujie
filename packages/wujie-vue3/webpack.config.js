const path = require('path')

module.exports = {
  entry: './index.js',
  target: ["web", "es5"],
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, './lib'),
    filename: 'index.js',
    library: 'WujieVue',
    libraryTarget: 'umd',
    globalObject: 'self',
    umdNamedDefine: true
  },
  mode: "production",
  externals: {
    vue: {
      root: "Vue",
      commonjs: "vue",
      commonjs2: "vue",
      amd: "vue"
    }
  },
  resolve: {
    extensions: ['.js']
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}
