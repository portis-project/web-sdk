const path = require('path');

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
            path.resolve(__dirname, 'node_modules/@portis/web3-provider-engine')
          ],
          use: 'babel-loader',
        },
      ],
    },
  },
];
