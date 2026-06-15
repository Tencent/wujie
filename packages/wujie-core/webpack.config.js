const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  target: ["web", "es5"],
  output: {
    publicPath: "/",
    path: path.resolve(__dirname, "./lib"),
    filename: "index.js",
    library: "wujie",
    libraryTarget: "umd",
    globalObject: "self",
    umdNamedDefine: true,
  },
  mode: "production",
  resolve: {
    extensions: [".ts", ".js"],
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
};
