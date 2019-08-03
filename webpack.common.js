const path = require('path');
module.exports = {
  entry: path.join(__dirname, 'src', 'index.ts'),
  watch: false,
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        loader: 'ts-loader',
        test: /\.ts$/,
        exclude: [
          path.resolve(__dirname, 'built'),
          path.resolve(__dirname, 'node_modules'),
          path.resolve(__dirname, 'tests'),
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.ts']
  },
  devtool: 'source-map',
};