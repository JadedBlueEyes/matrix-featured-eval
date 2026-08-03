// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json" with { type: "json" };
import { isBuiltin } from "node:module";

const external = (id) =>
    isBuiltin(id) || pkg.dependencies?.[id] || pkg.peerDependencies?.[id];

export default [
    {
        input: "src/index.ts",
        output: [
            { file: pkg.exports.require, format: "cjs", sourcemap: true },
            { file: pkg.exports.import, format: "es", sourcemap: true },
        ],
        plugins: [typescript()],
        external,
		
    }
];
