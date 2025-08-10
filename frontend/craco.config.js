const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Production optimizations
      if (env === 'production') {
        // Set public path for chunk loading
        webpackConfig.output.publicPath = '/';
        // Add contenthash to chunk names for cache busting
        webpackConfig.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
        
        // Optimize JS bundles
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              // 기본 vendor 설정만 유지
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
              },
              // 공통 코드
              common: {
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true,
              },
            },
          },
          // Use deterministic IDs for stable module references
          moduleIds: 'deterministic',
          chunkIds: 'deterministic',
          runtimeChunk: false,
          // Minimize JS
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                parse: {
                  ecma: 8,
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: false, // Keep console logs for debugging
                },
                mangle: {
                  safari10: true,
                },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
              },
              extractComments: false,
            }),
            // Minimize CSS
            new CssMinimizerPlugin({
              minimizerOptions: {
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true },
                  },
                ],
              },
            }),
          ],
        };

        // Set performance hints
        webpackConfig.performance = {
          hints: 'warning',
          maxEntrypointSize: 512000, // 500 KB
          maxAssetSize: 512000, // 500 KB
        };

        // Add module concatenation for smaller bundles
        webpackConfig.optimization.concatenateModules = true;

        // Tree shaking optimization
        webpackConfig.optimization.usedExports = true;
        webpackConfig.optimization.sideEffects = false;
        
        // Add webpack plugins for better optimization
        webpackConfig.plugins.push(
          new webpack.optimize.ModuleConcatenationPlugin(),
          // Add prefetch/preload hints for lazy-loaded routes
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
          })
        );
      }

      // Development optimizations
      if (env === 'development') {
        // Faster rebuilds in development
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        };
        
        // Use cheap-module-source-map for faster rebuilds with better debugging
        webpackConfig.devtool = 'cheap-module-source-map';
      }

      // Add resource hints for better loading
      webpackConfig.plugins.push(
        new webpack.ids.DeterministicModuleIdsPlugin({
          maxLength: 5,
        })
      );
      
      return webpackConfig;
    },
  },
  // Optimize build speed
  babel: {
    presets: [
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
        },
      ],
    ],
    plugins: [
      // Remove prop-types in production
      process.env.NODE_ENV === 'production' && [
        'transform-react-remove-prop-types',
        {
          removeImport: true,
        },
      ],
    ].filter(Boolean),
  },
};