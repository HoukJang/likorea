const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');

const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
  style: {
    postcss: {
      plugins: (plugins) => {
        if (process.env.NODE_ENV === 'production') {
          return [
            ...plugins,
            purgecss({
            content: [
              './src/**/*.{js,jsx,ts,tsx}',
              './public/index.html'
            ],
            defaultExtractor: content => {
              // 클래스명 추출 개선
              const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
              const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
              return broadMatches.concat(innerMatches);
            },
            safelist: {
              standard: [
                // React 관련
                /^root/,
                /^App/,
                // MUI 관련
                /^Mui/,
                /^MuiButton/,
                /^MuiDialog/,
                // Quill 에디터
                /^ql-/,
                /^quill/,
                // 애니메이션
                /fade/,
                /slide/,
                // 상태 클래스
                /active/,
                /disabled/,
                /selected/,
                /hover/,
                /focus/,
                /error/,
                /success/,
                // 동적 클래스
                /^banner/,
                /^header/,
                /^board/,
                /^admin/,
                /^loading/
              ]
            }
          })
          ];
        }
        return plugins;
      }
    }
  },
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Production optimizations
      if (env === 'production') {
        // Set public path for chunk loading
        webpackConfig.output.publicPath = '/';
        // Add contenthash to chunk names for cache busting
        webpackConfig.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
        // Ensure chunk loading works correctly
        webpackConfig.output.crossOriginLoading = 'anonymous';
        
        // Ensure all output files have contenthash for long-term caching
        webpackConfig.output.filename = 'static/js/[name].[contenthash:8].js';
        webpackConfig.output.assetModuleFilename = 'static/media/[name].[contenthash:8][ext]';
        
        // Optimize JS bundles
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              // MUI와 emotion을 먼저 처리 (우선순위 높게)
              mui: {
                test: /[\\/]node_modules[\\/](@mui[\\/]|@emotion[\\/])/,
                name: 'mui',
                priority: 20,
                reuseExistingChunk: true
              },
              // React Quill 분리 (약 200KB)
              quill: {
                test: /[\\/]node_modules[\\/](react-quill|quill)[\\/]/,
                name: 'quill',
                priority: 10,
                reuseExistingChunk: true
              },
              // Chart.js 분리 (약 100KB)
              chart: {
                test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
                name: 'chart',
                priority: 10,
                reuseExistingChunk: true
              },
              // browser-image-compression 분리 (UPNG/UZIP 포함)
              imageCompression: {
                test: /[\\/]node_modules[\\/](browser-image-compression|uzip|upng)[\\/]/,
                name: 'image-compression',
                priority: 10,
                reuseExistingChunk: true
              },
              // 나머지 vendors
              defaultVendors: {
                test: /[\\/]node_modules[\\/]/,
                priority: -10,
                reuseExistingChunk: true,
                name: 'vendors'
              },
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true
              }
            }
          },
          // Use hashed IDs to avoid conflicts
          moduleIds: 'hashed',
          chunkIds: 'named',
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