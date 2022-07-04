const path = require("path");

module.exports = {
  entry: "./index.js",
  target: ["web", "es5"],
  output: {
    publicPath: "/",
    path: path.resolve(__dirname, "./lib"),
    filename: "index.js",
    library: "WujieReact",
    libraryTarget: "umd",
    globalObject: "self",
    umdNamedDefine: true,
  },
  mode: "production",
  externals: {
    react: {
      root: "React",
      commonjs: "react",
      commonjs2: "react",
      amd: "React",
    },
  },
  devtool: 'source-map',
  resolve: {
    extensions: [".js"],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
};
