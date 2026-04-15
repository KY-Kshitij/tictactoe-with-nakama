import resolve from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './nakama/index.ts',
  treeshake: false,
  output: {
    file: 'build/main.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    commonJS(),
    typescript()
  ],
  external: ['nakama-runtime']
};
