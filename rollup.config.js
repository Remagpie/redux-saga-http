import typescript from "rollup-plugin-typescript2";

import * as pkg from "./package.json";

export default {
	input: "./src/index.ts",
	output: [
		{
			file: pkg.main,
			format: "cjs",
		},
		{
			file: pkg.module,
			format: "es",
		},
	],
	external: ["path-to-regexp", "redux-saga/effects"],
	plugins: [
		typescript({
			// eslint-disable-next-line global-require
			typescript: require("typescript"),
		}),
	],
};
