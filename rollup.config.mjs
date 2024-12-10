import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import polyfillNode from "rollup-plugin-polyfill-node";
import json from "@rollup/plugin-json";

/** @type {import('rollup').RollupOptions} */
export default {
  input: "index.js",
  output: [
    {
      file: "dist/bundle.cjs.js",
      format: "cjs",
      exports: "auto",
      sourcemap: true
    },
    {
      file: "dist/bundle.esm.js",
      format: "esm",
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    polyfillNode(),
    json()
  ]
};
