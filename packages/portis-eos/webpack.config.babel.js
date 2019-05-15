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
          include: [path.resolve(__dirname, 'src')],
          use: 'babel-loader',
        },
      ],
    },
  },
];
