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
    },
    module: {
      rules: [
        {
          test: /\.(js)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
      ],
    },
  },
];
