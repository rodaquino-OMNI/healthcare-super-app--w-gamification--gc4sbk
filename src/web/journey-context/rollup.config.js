import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    'react/jsx-runtime',
    '@react-native-async-storage/async-storage',
    'react-native',
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx'],
      },
    }),
  ],
};