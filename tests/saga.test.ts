/* eslint-disable no-unused-expressions */

import { expect } from "chai";
import { BAD_REQUEST, OK } from "http-status-codes";
import { runSaga } from "redux-saga";
import * as effects from "redux-saga/effects";
import * as sinon from "sinon";

import { createHttpAction, HttpFailAction } from "../src/action";
import { StatusError } from "../src/error";
import { HttpState } from "../src/reducer";
import { createHttpSaga } from "../src/saga";
import { Action, FetchAction, Parameter, Request } from "./types";

describe("Single Http Saga", () => {
	const path = "https://www.example.com/";
	const method = "POST";
	const httpAction = createHttpAction<Parameter, Request>("TYPE")({
		params: undefined,
		request: {
			foo: 42,
		},
	});

	async function execute(options: {
		state?: HttpState;
		response?: { status: number };
		callback?: () => IterableIterator<any>;
	}) {
		const defaultState = { resolved: true };
		const defaultResponse = { status: OK };

		// Apply default options if option is not provided
		const { callback } = options;
		let { state, response } = options;
		state = state != null ? state : defaultState;
		response = response != null ? response : defaultResponse;

		// Prepare fake environment
		const dispatched: Action[] = [];
		(global as any).fetch = sinon.fake(
			async (input: RequestInfo, init?: RequestInit) => {
				dispatched.push({
					type: "FETCH",
					payload: {
						input,
						init,
					},
				});
				return Promise.resolve(response);
			}
		);

		const saga = createHttpSaga({
			type: httpAction.type,
			path,
			method,
			selector: (s) => s,
			callback,
		});

		// Run the saga
		const task = runSaga(
			{
				dispatch: (a: Action) => dispatched.push(a),
				getState: () => state,
			},
			saga,
			httpAction
		);
		await task.toPromise();

		return dispatched;
	}

	it("should dispatch start action at the start", async () => {
		const dispatched = await execute({});
		expect(dispatched[0]).to.be.deep.equal({
			type: `${httpAction.type}/START`,
			payload: httpAction.payload,
		});
	});

	it("should send http request in the middle", async () => {
		const dispatched = await execute({});
		const fetchAction = dispatched[1] as FetchAction;
		expect(fetchAction).to.have.property("type", "FETCH");
		expect(fetchAction).to.have.nested.property("payload.input", path);
		expect(fetchAction).to.have.deep.nested.property("payload.init", {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(httpAction.payload.request),
		});
	});

	it("should call callback before dispatching finish action", async () => {
		const response = { status: OK };
		const dispatched = await execute({
			response,
			callback: sinon.fake(function*(data: any): IterableIterator<any> {
				yield effects.put({
					type: "CALLBACK",
					payload: data,
				});
			}),
		});
		expect(dispatched[2]).to.be.deep.equal({
			type: "CALLBACK",
			payload: {
				...httpAction.payload,
				response,
			},
		});
	});

	it("should dispatch finish action at the end", async () => {
		const dispatched = await execute({});
		expect(dispatched[dispatched.length - 1]).to.be.deep.equal({
			type: `${httpAction.type}/FINISH`,
			payload: httpAction.payload,
		});
	});

	it("should add error to finish action for unsuccessful status code", async () => {
		const response = { status: BAD_REQUEST };
		const dispatched = await execute({ response });
		const action = dispatched[dispatched.length - 1] as HttpFailAction<
			Parameter,
			Request
		>;
		expect(action.type).to.be.equal(`${httpAction.type}/FINISH`);
		expect(action.payload).to.include(httpAction.payload);
		expect(action.error).to.be.true;

		const error = action.payload.error as StatusError;
		expect(error).to.be.instanceof(StatusError);
		expect(error.response.status).to.be.equal(response.status);
	});

	it("should not execute saga if there is unresolved request", async () => {
		const dispatched = await execute({
			state: {
				resolved: false,
			},
		});
		expect(dispatched).to.be.empty;
	});

	afterEach(() => {
		delete (global as any).fetch;
	});
});
