const webpack = require('webpack');
const portInfo = require('../config.json')['dev/react'];

module.exports = {
  webpack(config, env) {
    config.devtool = 'source-map';
    config.output.libraryTarget = 'umd';
    config.output.globalObject = 'window';
    config.output.jsonpFunction = 'react-garfish-exports';
    config.mode = process.env.TEST_ENV ? 'production' : 'development';
    config.output.publicPath = `http://localhost:${portInfo.port}/`;
    config.plugins.push(
      new webpack.BannerPlugin({
        raw: true,
        test: /.js$/,
        banner: '/* empty */\n',
      }),
    );
    config.resolve.alias['react-dom'] = '@hot-loader/react-dom';
    return config;
  },

  devServer(configFunction) {
    return (proxy, allowedHost) => {
      const config = configFunction(proxy, allowedHost);
      config.open = false;
      config.overlay = false;
      config.disableHostCheck = true;
      config.headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      };
      return config;
    };
  },
};
