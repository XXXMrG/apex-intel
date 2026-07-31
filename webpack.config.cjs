const path = require('node:path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = (_, argv = {}) => {
  const production = argv.mode === 'production'
  return {
    mode: production ? 'production' : 'development',
    entry: path.resolve(__dirname, 'src/main.tsx'),
    devtool: production ? 'source-map' : 'eval-cheap-module-source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'assets/[name].[contenthash:8].js',
      chunkFilename: 'assets/[name].[contenthash:8].js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                ['@babel/preset-env', { targets: { esmodules: true }, modules: false }],
                ['@babel/preset-react', { runtime: 'automatic' }],
                ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
              ],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.html'),
        inject: 'body',
        scriptLoading: 'defer',
        minify: production,
      }),
      new MiniCssExtractPlugin({ filename: 'assets/[name].[contenthash:8].css' }),
      new CopyWebpackPlugin({
        patterns: [{ from: path.resolve(__dirname, 'public'), to: '.', noErrorOnMissing: true }],
      }),
    ],

    performance: {
      hints: production ? 'warning' : false,
      maxEntrypointSize: 420000,
      maxAssetSize: 420000,
    },
    stats: 'errors-warnings',
  }
}
