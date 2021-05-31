const dotenv = require('dotenv');
const path = require('path');
const webpack = require('webpack');

dotenv.config();

const portisEnvVars = Object.keys(process.env)
  .filter(key => key.startsWith('PORTIS'))
  .reduce((agg, key) => {
    agg[`process.env.${key}`] = JSON.stringify(process.env[key]);
    return agg;
  }, {});

export default () => [
  {
    mode: 'production',
    entry: './es/index.js',
    node: {
      fs: 'empty',
    },
    output: {
      path: path.resolve(__dirname, './umd'),
      filename: 'index.js',
      libraryTarget: 'umd',
      globalObject: 'this',
      library: 'Portis',
      libraryExport: 'default',
    },
    module: {
      rules: [
        {
          test: /\.(js)$/,
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules/@portis/web3-provider-engine'),
          ],
          use: 'babel-loader',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin(portisEnvVars),
      ...(Number(process.env.PORTIS_BUILD_SOURCE_MAPS) ? [new webpack.EvalSourceMapDevToolPlugin({})] : []),
    ],
  },
];
