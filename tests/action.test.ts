/* eslint-disable no-unused-expressions */

import { expect } from "chai";

import { createHttpAction } from "../src/action";

describe("Http Action Creator", () => {
	const type = "TYPE";
	const actionCreator = createHttpAction<number, string>(type);

	it("should have correct type", () => {
		const action = actionCreator({ params: 0, request: "" });
		expect(action).to.have.property("type", type);
	});

	it("should have correct payload", () => {
		const action = actionCreator({ params: 0, request: "" });
		expect(action).to.have.deep.property("payload", {
			params: 0,
			request: "",
		});
	});
});
