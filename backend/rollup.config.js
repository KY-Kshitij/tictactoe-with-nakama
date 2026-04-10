import resolve from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './nakama/index.ts',
  output: {
    file: 'build/main.js',
    format: 'iife',
    name: 'InitModule'
  },
  plugins: [
    resolve(),
    commonJS(),
    typescript()
  ],
  external: ['nakama-runtime']
};
