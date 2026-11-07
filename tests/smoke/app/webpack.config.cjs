const { resolve } = require('node:path');
const { DefinePlugin } = require('webpack');
// webpack 5 resolves `exports` and `module`; legacy paths are the deep-import test.

module.exports = {
  mode: 'production',
  target: 'web',
  context: __dirname,
  entry: {
    esm: './src/esm.js',
    deep: './src/deep.js',
    transitive: './src/transitive.js',
    cjs: './src/cjs.cjs',
  },
  output: { path: resolve(__dirname, 'out/webpack'), filename: '[name].js' },
  optimization: { minimize: false },
  plugins: [
    new DefinePlugin({
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    }),
  ],
};
