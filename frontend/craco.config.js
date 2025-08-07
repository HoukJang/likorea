const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

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
            cacheGroups: {
              // Vendor chunk for node_modules
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendor',
                priority: 10,
                reuseExistingChunk: true,
              },
              // Common chunk for code used in multiple places
              common: {
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true,
              },
              // Separate chunk for Material-UI
              mui: {
                test: /[\\/]node_modules[\\/]@mui[\\/]/,
                name: 'mui',
                priority: 20,
              },
              // Separate chunk for Chart.js
              charts: {
                test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
                name: 'charts',
                priority: 15,
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
        
        // Use eval-source-map for faster rebuilds
        webpackConfig.devtool = 'eval-source-map';
      }

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