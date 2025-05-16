module.exports = {
  presets: ['metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@api': './src/api',
          '@context': './src/context',
          '@assets': './src/assets',
          '@constants': './src/constants',
          '@i18n': './src/i18n',
          '@austa/design-system': '../../design-system/src',
          '@design-system/primitives': '../../primitives/src',
          '@austa/interfaces': '../../interfaces',
          '@austa/journey-context': '../../journey-context/src',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
  env: {
    production: {
      plugins: [
        'transform-remove-console',
        ['@babel/plugin-transform-react-constant-elements', { allowMutablePropsOnTags: ['FormattedMessage'] }],
        ['transform-react-remove-prop-types', { removeImport: true }],
      ],
    },
    development: {
      plugins: [
        '@babel/plugin-transform-runtime',
      ],
    },
    test: {
      plugins: ['@babel/plugin-transform-runtime'],
    },
  },
};