const path = require('path');
module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'src', 'index.ts'),
  watch: true,
  target: 'node',
  output: {
    path: __dirname + 'dist',
    filename: "bundle.js",
  },
  node: {
    fs: false
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
  // {
  //     test: /.jsx?$/,
  //     include: [
  //       path.resolve(__dirname, 'built')
  //     ],
  //     exclude: [
  //       path.resolve(__dirname, 'node_modules')
  //     ],
  //     loader: 'babel-loader',
  //     query: {
  //       presets: [
  //         ["@babel/env", {
  //           "targets": {
  //             "browsers": "last 2 chrome versions"
  //           }
  //         }]
  //       ]
  //     }
  //   }]
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.ts']
  },
  devtool: 'source-map',
  // devServer: {
  //   contentBase: path.join('/dist/'),
  //   inline: true,
  //   host: '0.0.0.0',
  //   port: 8080,
  // }
};