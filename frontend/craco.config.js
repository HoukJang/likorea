const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Production optimizations
      if (env === 'production') {
        // Optimize JS bundles
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 30,
            minSize: 10000,
            maxAsyncRequests: 30,
            cacheGroups: {
              // React core libraries - split into smaller chunks
              reactCore: {
                test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                name: 'react-core',
                priority: 35,
                reuseExistingChunk: true,
                enforce: true,
              },
              reactRouter: {
                test: /[\\/]node_modules[\\/](react-router|react-router-dom|history)[\\/]/,
                name: 'react-router',
                priority: 34,
                reuseExistingChunk: true,
              },
              // Material-UI components
              mui: {
                test: /[\\/]node_modules[\\/]@mui[\\/]/,
                name: 'mui',
                priority: 25,
                reuseExistingChunk: true,
              },
              // Chart.js libraries
              charts: {
                test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|@kurkle)[\\/]/,
                name: 'charts',
                priority: 20,
                reuseExistingChunk: true,
              },
              // Image compression libraries
              imageTools: {
                test: /[\\/]node_modules[\\/](browser-image-compression|pica|blueimp)[\\/]/,
                name: 'image-tools',
                priority: 18,
                reuseExistingChunk: true,
              },
              // Sanitization libraries
              sanitize: {
                test: /[\\/]node_modules[\\/](dompurify|sanitize-html)[\\/]/,
                name: 'sanitize',
                priority: 17,
                reuseExistingChunk: true,
              },
              // Date/Time libraries
              datetime: {
                test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)[\\/]/,
                name: 'datetime',
                priority: 16,
                reuseExistingChunk: true,
              },
              // Emotion styling libraries
              emotion: {
                test: /[\\/]node_modules[\\/]@emotion[\\/]/,
                name: 'emotion',
                priority: 15,
                reuseExistingChunk: true,
              },
              // Remaining vendor libraries
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendor',
                priority: 10,
                reuseExistingChunk: true,
                minSize: 30000,
              },
              // Common chunk for code used in multiple places
              common: {
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true,
                enforce: true,
              },
            },
          },
          // Use content hash for better caching
          moduleIds: 'deterministic',
          runtimeChunk: 'single',
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
                  drop_console: true, // Remove console logs in production
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