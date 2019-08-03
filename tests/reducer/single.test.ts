/* eslint-disable no-unused-expressions */

import { expect } from "chai";

import { HttpFinishAction, HttpStartAction } from "../../src/action";
import { HttpError } from "../../src/error";
import { createSingleHttpReducer, HttpState } from "../../src/reducer";
import { payload, Parameter, Request } from "../common";

describe("Single Http Reducer", () => {
	const type = "TYPE";
	const reducer = createSingleHttpReducer<Parameter, Request>(type);

	it("should have resolved default state", () => {
		const dummyAction: any = { type: "DUMMY" };
		const result = reducer(undefined, dummyAction);
		expect(result).to.have.property("resolved", true);
		expect(result.error).to.be.undefined;
	});

	it("should mark as unresolved if start action is received", () => {
		const state: HttpState = {
			resolved: true,
		};
		const startAction: HttpStartAction<Parameter, Request> = {
			type: `${type}/START`,
			payload,
		};
		const result = reducer(state, startAction);
		expect(result).to.have.property("resolved", false);
		expect(result.error).to.be.undefined;
	});

	it("should mark as resolved if success action is received", () => {
		const state: HttpState = {
			resolved: false,
		};
		const successAction: HttpFinishAction<Parameter, Request> = {
			type: `${type}/FINISH`,
			payload,
		};
		const result = reducer(state, successAction);
		expect(result).to.have.property("resolved", true);
		expect(result.error).to.be.undefined;
	});

	it("should mark as resolved and add error if fail action is received", () => {
		const state: HttpState = {
			resolved: false,
		};
		const failAction: HttpFinishAction<Parameter, Request> = {
			type: `${type}/FINISH`,
			payload: {
				...payload,
				error: ({} as any) as HttpError,
			},
			error: true,
		};
		const result = reducer(state, failAction);
		expect(result).to.have.property("resolved", true);
		expect(result.error).to.be.equal(failAction.payload.error);
	});
});
