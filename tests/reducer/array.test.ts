/* eslint-disable no-unused-expressions */

import { expect } from "chai";

import { HttpFinishAction, HttpStartAction } from "../../src/action";
import { HttpError } from "../../src/error";
import { createArrayHttpReducer } from "../../src/reducer";
import { Parameter, Request } from "../types";

describe("Array Http Reducer", () => {
	const type = "TYPE";
	const key = (payload: { request: Request }) => payload.request.foo;
	const reducer = createArrayHttpReducer<Parameter, Request>(type, key);
	const payload = {
		params: undefined,
		request: {
			foo: 42,
		},
	};
	const id = key(payload);

	it("should have empty default state", () => {
		const dummyAction: any = { type: "DUMMY" };
		const result = reducer(undefined, dummyAction);
		expect(result).to.be.empty;
	});

	it("should mark as unresolved if start action is received", () => {
		const startAction: HttpStartAction<Parameter, Request> = {
			type: `${type}/START`,
			payload,
		};
		const result = reducer({}, startAction);
		expect(result[id]).to.have.property("resolved", false);
		expect(result[id].error).to.be.undefined;
	});

	it("should mark as resolved if success action is received", () => {
		const successAction: HttpFinishAction<Parameter, Request> = {
			type: `${type}/FINISH`,
			payload,
		};
		const result = reducer({ [id]: { resolved: false } }, successAction);
		expect(result[id]).to.have.property("resolved", true);
		expect(result[id].error).to.be.undefined;
	});

	it("should mark as resolved and add error if fail action is received", () => {
		const failAction: HttpFinishAction<Parameter, Request> = {
			type: `${type}/FINISH`,
			payload: {
				...payload,
				error: ({} as any) as HttpError,
			},
			error: true,
		};
		const result = reducer({ [id]: { resolved: false } }, failAction);
		expect(result[id]).to.have.property("resolved", true);
		expect(result[id].error).to.be.equal(failAction.payload.error);
	});
});
