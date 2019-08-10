const path = require('path');
module.exports = {
  entry: path.join(__dirname, 'src', 'index.ts'),
  watch: false,
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "bundle.js",
    libraryTarget: "umd"
  },
  externals: {
    "lodash": {
      commonjs: "lodash",
      commonjs2: "lodash",
      amd: "lodash",
      root: "_"
    },
    "jsts": {
      commonjs: "jsts",
      commonjs2: "jsts",
      amd: "jsts",
      root: "jsts"
    },
    "ginkgoch-buffer-io": {
      commonjs: "ginkgoch-buffer-io",
      commonjs2: "ginkgoch-buffer-io",
      amd: "ginkgoch-buffer-io",
      root: "ginkgoch-buffer-io"
    },
    "ginkgoch-geom": {
      commonjs: "ginkgoch-geom",
      commonjs2: "ginkgoch-geom",
      amd: "ginkgoch-geom",
      root: "ginkgoch-geom"
    }
  },
  module: {
    rules: [
      {
        loader: 'ts-loader',
        test: /\.ts$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
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