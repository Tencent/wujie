// vue.config.js

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  publicPath: "./",
  devServer: {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    port: "7300",
  },
};
