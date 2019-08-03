/* eslint-disable no-unused-expressions */

import { expect } from "chai";

import { createHttpAction } from "../src/action";
import { Parameter, Request } from "./types";

describe("Http Action Creator", () => {
	const type = "TYPE";
	const actionCreator = createHttpAction<Parameter, Request>(type);

	it("should have correct type", () => {
		const action = actionCreator({
			params: undefined,
			request: { foo: 42 },
		});
		expect(action).to.have.property("type", type);
	});

	it("should have correct payload", () => {
		const action = actionCreator({
			params: undefined,
			request: { foo: 42 },
		});
		expect(action).to.have.deep.property("payload", {
			params: undefined,
			request: {
				foo: 42,
			},
		});
	});
});
