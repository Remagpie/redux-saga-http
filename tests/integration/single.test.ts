/* eslint-disable no-unused-expressions */

import { expect } from "chai";
import { BAD_REQUEST, OK } from "http-status-codes";
import { AnyAction } from "redux";
import * as effects from "redux-saga/effects";
import SagaTester from "redux-saga-tester";

import { createHttpAction, HttpFailAction } from "../../src/action";
import { StatusError } from "../../src/error";
import { createSingleHttpReducer, HttpState } from "../../src/reducer";
import { createHttpSaga } from "../../src/saga";
import { FetchAction, Parameter, Request } from "../types";

function mockFetch(dispatch: (a: AnyAction) => void, status: number) {
	(global as any).fetch = async (input: RequestInfo, init?: RequestInit) => {
		dispatch({
			type: "FETCH",
			payload: {
				input,
				init,
			},
		});
		return {
			status,
		};
	};
}

describe("Single Http Saga Integration", () => {
	const type = "TYPE";
	const path = "https://www.example.com/";
	const method = "POST";
	const httpAction = createHttpAction<Parameter, Request>(type)({
		params: undefined,
		request: {
			foo: 42,
		},
	});
	const reducer = createSingleHttpReducer<Parameter, Request>(type);
	const saga = createHttpSaga({
		type: httpAction.type,
		path,
		method,
		selector: (s: HttpState) => s,
		*callback(data: any): IterableIterator<any> {
			yield effects.put({
				type: "CALLBACK",
				payload: data,
			});
		},
	});
	let tester: SagaTester<HttpState>;

	beforeEach(() => {
		tester = new SagaTester<HttpState>({
			reducers: reducer,
			initialState: { resolved: true },
		});
		mockFetch(tester.dispatch.bind(tester), OK);
		tester.start(saga);
	});

	it("should dispatch start action at the start", async () => {
		tester.dispatch(httpAction);
		await tester.waitFor("CALLBACK");
		const actions = tester.getCalledActions();
		expect(actions[1]).to.be.deep.equal({
			type: `${httpAction.type}/START`,
			payload: httpAction.payload,
		});
	});

	it("should send http request in the middle", async () => {
		tester.dispatch(httpAction);
		await tester.waitFor("CALLBACK");
		const actions = tester.getCalledActions();
		const fetchAction = actions[2] as FetchAction;
		expect(fetchAction).to.have.property("type", "FETCH");
		expect(fetchAction).to.have.nested.property("payload.input", path);
		expect(fetchAction).to.have.deep.nested.property("payload.init", {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(httpAction.payload.request),
		});
	});

	it("should call callback before dispatching finish action", async () => {
		tester.dispatch(httpAction);
		await tester.waitFor("CALLBACK");
		const actions = tester.getCalledActions();
		expect(actions[3]).to.be.deep.equal({
			type: "CALLBACK",
			payload: {
				...httpAction.payload,
				response: {
					status: OK,
				},
			},
		});
	});

	it("should dispatch finish action at the end", async () => {
		tester.dispatch(httpAction);
		await tester.waitFor("CALLBACK");
		const actions = tester.getCalledActions();
		expect(actions[actions.length - 1]).to.be.deep.equal({
			type: `${httpAction.type}/FINISH`,
			payload: httpAction.payload,
		});
	});

	it("should add error to finish action for unsuccessful status code", async () => {
		mockFetch(tester.dispatch.bind(tester), BAD_REQUEST);
		tester.dispatch(httpAction);
		await tester.waitFor(`${httpAction.type}/FINISH`);
		const actions = tester.getCalledActions();
		const action = actions[actions.length - 1] as HttpFailAction<
			Parameter,
			Request
		>;
		expect(action.type).to.be.equal(`${httpAction.type}/FINISH`);
		expect(action.payload).to.include(httpAction.payload);
		expect(action.error).to.be.true;

		const error = action.payload.error as StatusError;
		expect(error).to.be.instanceof(StatusError);
		expect(error.response.status).to.be.equal(BAD_REQUEST);
	});

	it("should not execute saga if there is unresolved request", async () => {
		tester.updateState({ resolved: false });
		tester.dispatch(httpAction);
		const actions = tester.getCalledActions();
		expect(actions).to.be.lengthOf(3);
	});

	afterEach(() => {
		delete (global as any).fetch;
	});
});
