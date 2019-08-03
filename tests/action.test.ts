/* eslint-disable no-unused-expressions */

import { expect } from "chai";

import { createHttpAction } from "../src/action";
import { payload, Parameter, Request } from "./common";

describe("Http Action Creator", () => {
	const type = "TYPE";
	const actionCreator = createHttpAction<Parameter, Request>(type);

	it("should have correct type", () => {
		const action = actionCreator(payload);
		expect(action).to.have.property("type", type);
	});

	it("should have correct payload", () => {
		const action = actionCreator(payload);
		expect(action).to.have.deep.property("payload", payload);
	});
});
